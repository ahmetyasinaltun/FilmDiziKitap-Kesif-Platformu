/**
 * `npm run check:env`: .env'deki değerlerin biçimini ve gerçekten çalıştığını kontrol eder.
 * Hiçbir gizli değeri, anahtar içeren adresi veya yanıt gövdesini ekrana basmaz.
 */
import { config } from 'dotenv';
import pg from 'pg';
import { describeIssues, envSchema, migrationEnvSchema } from '../config/env-schema.js';

// Varsayılan server/.env; canlı veritabanı için ENV_FILE=.env.production (bkz. docs/SETUP.md §5).
config({ path: process.env.ENV_FILE ?? '.env', quiet: true });

const TIMEOUT_MS = 10_000;

type CheckResult = { ok: true; detail?: string } | { ok: false; detail: string };

async function checkPostgres(url: string): Promise<CheckResult> {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: TIMEOUT_MS });
  try {
    await client.connect();
    const { rows } = await client.query<{ server_version: string }>('SHOW server_version');
    return { ok: true, detail: `PostgreSQL ${rows[0]?.server_version ?? '?'}` };
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function checkHttp(
  url: string,
  init: RequestInit,
  isValid: (body: unknown) => boolean = () => true,
  retriesLeft = 1,
): Promise<CheckResult> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    if (retriesLeft > 0) return checkHttp(url, init, isValid, retriesLeft - 1);
    throw error;
  }
  // 5xx geçici olabilir (Google Books ara sıra 503 veriyor): bir kez daha dene.
  if (res.status >= 500 && retriesLeft > 0) return checkHttp(url, init, isValid, retriesLeft - 1);
  if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
  const body: unknown = await res.json();
  return isValid(body) ? { ok: true } : { ok: false, detail: 'beklenmeyen yanıt' };
}

/**
 * Brevo, e-posta göndermeden iki adımda denenir:
 * 1. Gönderme izni: boş gövdeli gönderim isteği. Yetki geçerse Brevo eksik alan için 400 döner
 *    ve hiçbir şey gönderilmez; 401 anahtar ya da IP sorunu, 403 izin eksikliğidir.
 * 2. Gönderen onayı: MAIL_FROM onaylı mı? Onaysız adresten gönderim reddedilir. Bunu okumak hesap
 *    izni ister; yalnız e-posta izinli (en az yetkili) anahtarda bu adım atlanır.
 */
async function checkBrevo(apiKey: string, sender: string): Promise<CheckResult> {
  const headers = { 'api-key': apiKey, accept: 'application/json' };
  const send = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (send.status === 401) {
    return { ok: false, detail: 'anahtar geçersiz ya da IP engelli (Security → Authorized IPs)' };
  }
  if (send.status === 403) return { ok: false, detail: 'anahtarın e-posta gönderme izni yok' };
  if (send.status !== 400) return { ok: false, detail: `HTTP ${send.status}` };

  const res = await fetch('https://api.brevo.com/v3/senders', {
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 403) {
    return { ok: true, detail: 'gönderebiliyor; gönderen onayını Brevo panelinden kontrol et' };
  }
  if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
  const body = (await res.json()) as { senders?: { email?: string; active?: boolean }[] };
  const match = body.senders?.find((item) => item.email?.toLowerCase() === sender.toLowerCase());
  if (!match) return { ok: false, detail: 'MAIL_FROM, Brevo’da gönderen olarak eklenmemiş' };
  if (!match.active) return { ok: false, detail: 'MAIL_FROM henüz onaylanmamış (Brevo e-postası)' };
  return { ok: true, detail: 'gönderen onaylı' };
}

/** Hata mesajı bir adres içerebilir (anahtarlı query string). Sadece güvenli kısmı göster. */
function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError') return 'zaman aşımı';
    const cause = error.cause;
    if (cause instanceof Error && 'code' in cause) return `bağlantı hatası (${String(cause.code)})`;
    if ('code' in error) return `hata (${String(error.code)})`;
  }
  return 'bağlantı hatası';
}

async function main() {
  console.log('Ortam değişkenleri kontrol ediliyor...\n');

  const parsed = envSchema.safeParse(process.env);
  const migration = migrationEnvSchema.safeParse(process.env);
  const formatIssues = [
    ...(parsed.success ? [] : describeIssues(parsed.error)),
    ...(migration.success ? [] : describeIssues(migration.error)),
  ];
  if (!parsed.success || !migration.success) {
    console.log(`✗ Biçim hataları (server/${process.env.ENV_FILE ?? '.env'}, bkz. docs/SETUP.md):`);
    for (const issue of formatIssues) console.log(`  - ${issue}`);
    process.exitCode = 1;
    return;
  }
  console.log('✓ Biçim: tüm değişkenler mevcut ve geçerli\n');

  const env = parsed.data;
  const checks: { name: string; required: boolean; run: () => Promise<CheckResult> }[] = [
    {
      name: 'Neon (DATABASE_URL, pooled)',
      required: true,
      run: () => checkPostgres(env.DATABASE_URL),
    },
    {
      name: 'Neon (DIRECT_URL, migration)',
      required: true,
      run: () => checkPostgres(migration.data.DIRECT_URL),
    },
    {
      name: 'TMDB',
      required: true,
      run: () =>
        checkHttp('https://api.themoviedb.org/3/configuration', {
          headers: { Authorization: `Bearer ${env.TMDB_API_TOKEN}` },
        }),
    },
    {
      name: 'OMDb',
      required: true,
      run: () =>
        checkHttp(
          `https://www.omdbapi.com/?${new URLSearchParams({ apikey: env.OMDB_API_KEY, i: 'tt1375666' })}`,
          {},
          (body) =>
            typeof body === 'object' &&
            body !== null &&
            'Response' in body &&
            body.Response === 'True',
        ),
    },
    {
      name: 'Google Books',
      // Sadece Türkçe açıklama için; arama altyapısı sık 503 veriyor, uygulama onsuz da çalışır.
      required: false,
      run: () =>
        checkHttp(
          `https://www.googleapis.com/books/v1/volumes?${new URLSearchParams({ q: 'tutunamayanlar', maxResults: '1', key: env.GOOGLE_BOOKS_API_KEY })}`,
          {},
        ),
    },
    {
      // Kitapların ana kaynağı (anahtar istemez)
      name: 'Open Library',
      required: true,
      run: () =>
        checkHttp('https://openlibrary.org/search.json?q=tutunamayanlar&limit=1', {
          headers: { 'User-Agent': env.APP_USER_AGENT },
        }),
    },
    {
      // Kayıttaki doğrulama e-postası; düşerse hesap açılır ama doğrulanamaz. Geliştirmede boş
      // bırakılabilir (bağlantı terminale yazılır); canlıda env şeması zaten zorunlu tutar.
      name: 'Brevo (e-posta)',
      required: env.BREVO_API_KEY !== undefined,
      run: async () =>
        env.BREVO_API_KEY && env.MAIL_FROM
          ? checkBrevo(env.BREVO_API_KEY, env.MAIL_FROM)
          : { ok: false, detail: 'boş: e-posta gönderilmez, bağlantı terminale yazılır' },
    },
    {
      // Kitapların Türkçe açıklaması (isteğe bağlı)
      name: 'Vikipedi',
      required: false,
      run: () =>
        checkHttp(
          'https://tr.wikipedia.org/w/api.php?action=query&titles=Tutunamayanlar&format=json',
          { headers: { 'User-Agent': env.APP_USER_AGENT } },
        ),
    },
  ];

  const results = await Promise.all(
    checks.map(async (check) => {
      try {
        return { check, result: await check.run() };
      } catch (error) {
        return { check, result: { ok: false, detail: safeErrorMessage(error) } as CheckResult };
      }
    }),
  );

  for (const { check, result } of results) {
    const mark = result.ok ? '✓' : check.required ? '✗' : '!';
    const detail = result.detail ? ` (${result.detail})` : '';
    console.log(`${mark} ${check.name}${detail}`);
  }

  const failed = results.filter(({ check, result }) => check.required && !result.ok);
  if (failed.length > 0) {
    console.log(`\n${failed.length} zorunlu kontrol başarısız. Ayrıntılar: docs/SETUP.md`);
    process.exitCode = 1;
  } else {
    console.log('\nHer şey hazır.');
  }
}

await main();
