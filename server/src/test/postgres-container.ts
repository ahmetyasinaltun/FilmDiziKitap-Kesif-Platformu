import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import pg from 'pg';
import type { TestProject } from 'vitest/node';
import { TEMPLATE_DATABASE, withDatabase } from './db-url.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../prisma/migrations');

declare module 'vitest' {
  export interface ProvidedContext {
    postgresUrl: string;
  }
}

/**
 * Veritabanı testlerinin genel kurulumu (Vitest globalSetup), test çalıştırması başına bir kez:
 * Docker'da canlıdakiyle aynı ana sürümde bir PostgreSQL açar ve migration'ları şablon
 * veritabanına uygular. Test dosyaları bu şablonun kopyalarıyla çalışır (test/database.ts).
 */
export default async function setup(project: TestProject) {
  let container: StartedPostgreSqlContainer;
  try {
    container = await new PostgreSqlContainer('postgres:18-alpine').start();
  } catch (error) {
    throw new Error(
      'Veritabanı testleri Docker ister: Docker Desktop çalışıyor mu? ' +
        'Sadece birim testleri için: npm run test:unit -w server',
      { cause: error },
    );
  }

  const serverUrl = container.getConnectionUri();
  await runSql(serverUrl, [`CREATE DATABASE ${TEMPLATE_DATABASE}`]);

  const migrations = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  await runSql(
    withDatabase(serverUrl, TEMPLATE_DATABASE),
    migrations.map((name) => readFileSync(join(MIGRATIONS_DIR, name, 'migration.sql'), 'utf8')),
  );

  project.provide('postgresUrl', serverUrl);
  return async () => {
    await container.stop();
  };
}

async function runSql(url: string, statements: string[]) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    for (const sql of statements) await client.query(sql);
  } finally {
    await client.end();
  }
}
