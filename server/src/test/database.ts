import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, inject, vi } from 'vitest';
import type * as mailer from '../lib/mailer.js';
import { TEMPLATE_DATABASE, withDatabase } from './db-url.js';

// Veritabanı testleri hiçbir zaman gerçek e-posta göndermez (kayıt bile bir e-posta tetikler).
// Gönderilenler `src/test/mail.ts` ile okunur; gerçek gönderim `lib/mailer.test.ts`'te.
vi.mock('../lib/mailer.js', async (importOriginal) => ({
  ...(await importOriginal<typeof mailer>()),
  sendEmail: vi.fn(),
}));

/**
 * Her veritabanı test dosyasına özel, migration'ları uygulanmış boş bir PostgreSQL veritabanı
 * (şablondan kopyalanır, ~0,1 sn). Uygulama gerçek sürücüyle bağlanır; hiçbir sorgu taklit edilmez.
 *
 * Bu modül `db` projesinin `setupFiles` adımında, test dosyası yüklenmeden ÖNCE çalışır:
 * uygulama `DATABASE_URL`'i yüklenirken okuduğu için adresin ondan önce ayarlanması gerekir.
 * Test dosyaları aynı örneği `import { db } from '../test/database.js'` ile kullanır.
 */
async function createTestDatabase() {
  const serverUrl = inject('postgresUrl');
  const name = `test_${randomUUID().replaceAll('-', '')}`;

  const admin = new pg.Client({ connectionString: serverUrl });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${name} TEMPLATE ${TEMPLATE_DATABASE}`);
  await admin.end();

  const url = withDatabase(serverUrl, name);
  process.env.DATABASE_URL = url;

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  afterAll(() => client.end());

  const { rows } = await client.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  const tables = rows.map((row) => `"${row.tablename}"`).join(', ');

  return {
    name,
    /** Testler arasında tüm tabloları boşaltır. */
    async reset() {
      await client.query(`TRUNCATE ${tables} CASCADE`);
    },
    /** Uygulamayı atlayıp veritabanını doğrudan kontrol etmek için. */
    query: <T extends pg.QueryResultRow>(sql: string, params?: unknown[]) =>
      client.query<T>(sql, params),
  };
}

export const db = await createTestDatabase();
