import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, inject } from 'vitest';
import { TEMPLATE_DATABASE, withDatabase } from './db-url.js';

/**
 * Bu test dosyasına özel, migration'ları uygulanmış boş bir PostgreSQL veritabanı açar
 * (şablondan kopyalanır, ~0,1 sn). Uygulama gerçek sürücüyle bağlanır; hiçbir sorgu taklit edilmez.
 *
 * Uygulama modülleri `DATABASE_URL`'i yüklenirken okuduğu için bu fonksiyon, uygulama
 * import edilmeden ÖNCE çağrılır:
 *
 *   const db = await startTestDatabase();
 *   const { createApp } = await import('../app.js');
 */
export async function startTestDatabase() {
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
    /** Testler arasında tüm tabloları boşaltır. */
    async reset() {
      await client.query(`TRUNCATE ${tables} CASCADE`);
    },
    /** Uygulamayı atlayıp veritabanını doğrudan kontrol etmek için. */
    query: <T extends pg.QueryResultRow>(sql: string, params?: unknown[]) =>
      client.query<T>(sql, params),
  };
}
