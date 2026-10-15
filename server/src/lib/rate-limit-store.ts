import type { IncrementResponse, Options, Store } from 'express-rate-limit';
import { prisma } from './prisma.js';

/** Her artırmada bu olasılıkla süresi dolmuş sayaçlar silinir (ayrı bir zamanlanmış iş gerekmesin). */
const CLEANUP_PROBABILITY = 0.02;

/**
 * express-rate-limit sayaçlarını PostgreSQL'de (RateLimit tablosu) tutar.
 * Kütüphanenin varsayılan deposu bellekte çalışır; Vercel'de her istek farklı bir örneğe
 * düşebildiği için orada sayaç her seferinde sıfırdan başlar ve sınır işe yaramaz.
 */
class PostgresRateLimitStore implements Store {
  readonly localKeys = false;
  readonly prefix: string;
  private windowMs = 60_000;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private key(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Tek bir SQL ifadesiyle atomik artış: aynı anda gelen iki istek sayacı aynı değerden
   * okuyup birbirinin üzerine yazamaz. Süresi dolmuş sayaç 1'den yeniden başlar.
   */
  async increment(key: string): Promise<IncrementResponse> {
    const now = new Date();
    const resetAt = new Date(now.getTime() + this.windowMs);
    const rows = await prisma.$queryRaw<{ hits: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "hits", "resetAt")
      VALUES (${this.key(key)}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "hits" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."hits" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
      RETURNING "hits", "resetAt"`;
    const row = rows[0];
    if (!row) throw new Error('RateLimit sayacı güncellenemedi');

    if (Math.random() < CLEANUP_PROBABILITY) {
      await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } });
    }
    return { totalHits: row.hits, resetTime: row.resetAt };
  }

  async decrement(key: string): Promise<void> {
    await prisma.rateLimit.updateMany({
      where: { key: this.key(key), hits: { gt: 0 } },
      data: { hits: { decrement: 1 } },
    });
  }

  async resetKey(key: string): Promise<void> {
    await prisma.rateLimit.deleteMany({ where: { key: this.key(key) } });
  }
}

export function createRateLimitStore(prefix: string): Store {
  return new PostgresRateLimitStore(prefix);
}
