import type { Options } from 'express-rate-limit';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../test/database.js';
import { createRateLimitStore } from './rate-limit-store.js';

function storeWithWindow(prefix: string, windowMs: number) {
  const store = createRateLimitStore(prefix);
  void store.init?.({ windowMs } as Options);
  return store;
}

beforeEach(async () => {
  await db.reset();
});

describe('PostgreSQL rate limit deposu', () => {
  it('sayaçları anahtar ve sınır başına ayrı tutar', async () => {
    const login = storeWithWindow('login', 60_000);
    const register = storeWithWindow('register', 60_000);

    await login.increment('1.2.3.4');
    const second = await login.increment('1.2.3.4');
    const otherIp = await login.increment('5.6.7.8');
    const otherLimit = await register.increment('1.2.3.4');

    expect(second.totalHits).toBe(2);
    expect(otherIp.totalHits).toBe(1);
    expect(otherLimit.totalHits).toBe(1);
    expect(second.resetTime!.getTime()).toBeGreaterThan(Date.now());
  });

  it('aynı anda gelen artışları kaybetmez (atomik)', async () => {
    const store = storeWithWindow('login', 60_000);

    await Promise.all(Array.from({ length: 20 }, () => store.increment('1.2.3.4')));

    expect((await store.increment('1.2.3.4')).totalHits).toBe(21);
  });

  it('süresi dolan pencerede sayaç 1’den yeniden başlar', async () => {
    const store = storeWithWindow('login', 60_000);
    await store.increment('1.2.3.4');
    await store.increment('1.2.3.4');
    await db.query(`UPDATE "RateLimit" SET "resetAt" = now() - interval '1 second'`);

    const afterWindow = await store.increment('1.2.3.4');

    expect(afterWindow.totalHits).toBe(1);
    expect(afterWindow.resetTime!.getTime()).toBeGreaterThan(Date.now());
  });

  it('başarılı istek sayaçtan düşülür, sayaç sıfırlanabilir', async () => {
    const store = storeWithWindow('login', 60_000);
    await store.increment('1.2.3.4');
    await store.increment('1.2.3.4');

    await store.decrement('1.2.3.4');
    expect((await store.increment('1.2.3.4')).totalHits).toBe(2);

    await store.resetKey('1.2.3.4');
    expect((await store.increment('1.2.3.4')).totalHits).toBe(1);
  });
});
