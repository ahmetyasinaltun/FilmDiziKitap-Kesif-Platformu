import { describe, expect, it } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { db } from './database.js';

describe('test veritabanı kurulumu', () => {
  it('uygulama, bu dosyaya özel test veritabanına bağlanır', async () => {
    const [row] = await prisma.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;

    expect(row?.name).toBe(db.name);
  });

  it('tüm migration’lar uygulanmış', async () => {
    const { rows } = await db.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    );

    expect(rows.map((row) => row.tablename)).toContain('RateLimit');
  });
});
