import type { Prisma } from '../generated/prisma/client.js';
import { createCache, type CacheStore } from './cache.js';
import { prisma } from './prisma.js';

const prismaStore: CacheStore = {
  async get(key) {
    const row = await prisma.apiCache.findUnique({ where: { key } });
    return row ? { data: row.data, expiresAt: row.expiresAt } : null;
  },
  async set(key, data, expiresAt) {
    // Sadece kendi ürettiğimiz, JSON'a çevrilebilir normalize veri yazılır.
    const json = data as Prisma.InputJsonValue;
    await prisma.apiCache.upsert({
      where: { key },
      create: { key, data: json, expiresAt },
      update: { data: json, expiresAt },
    });
  },
  async deleteExpiredBefore(date) {
    const { count } = await prisma.apiCache.deleteMany({ where: { expiresAt: { lt: date } } });
    return count;
  },
};

/** Dış API yanıtları için uygulama genelindeki önbellek (PostgreSQL'de). */
export const { cached } = createCache(prismaStore);
