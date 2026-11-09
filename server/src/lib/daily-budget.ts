import { prisma } from './prisma.js';

/**
 * Dış bir servise günde en fazla `limit` çağrı yapılmasını sağlar; sayaç PostgreSQL'de, bütün
 * sunucu örnekleri için ortak. Sayaç UTC gününe göre ayrı anahtarda tutulur, gün değişince
 * kendiliğinden yeniden başlar; eski sayaçları istek sınırı deposunun temizliği siler.
 *
 * Neden: OMDb'nin ücretsiz planı günde 1000 istek. IP başına sınır tek bir kaynağı yavaşlatır
 * ama birçok adresten gelen kötüye kullanımı durduramaz; kota dolarsa puanlar o gün herkes için
 * kaybolur. Bütçe aşılınca servis hiç çağrılmaz ve sayfa puansız ama çalışır halde kalır.
 *
 * @returns Çağrı yapılabilirse `true`.
 */
export async function takeFromDailyBudget(
  name: string,
  limit: number,
  now = new Date(),
): Promise<boolean> {
  const day = now.toISOString().slice(0, 10);
  const nextDay = new Date(`${day}T00:00:00.000Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const rows = await prisma.$queryRaw<{ hits: number }[]>`
    INSERT INTO "RateLimit" ("key", "hits", "resetAt")
    VALUES (${`budget:${name}:${day}`}, 1, ${nextDay})
    ON CONFLICT ("key") DO UPDATE SET "hits" = "RateLimit"."hits" + 1
    RETURNING "hits"`;
  return (rows[0]?.hits ?? Number.POSITIVE_INFINITY) <= limit;
}
