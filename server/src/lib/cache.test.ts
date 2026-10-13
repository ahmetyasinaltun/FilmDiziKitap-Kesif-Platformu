import { describe, expect, it, vi } from 'vitest';
import { createCache, createMemoryStore, type CacheStore } from './cache.js';
import { ProviderError } from './http.js';

const HOUR = 3600;

function setup(start = new Date('2026-01-01T00:00:00Z')) {
  let current = start;
  const store = createMemoryStore();
  const { cached } = createCache(store, () => current);
  const advance = (seconds: number) => {
    current = new Date(current.getTime() + seconds * 1000);
  };
  return { store, cached, advance };
}

describe('cached', () => {
  it('taze kayıt varken kaynağa gitmez', async () => {
    const { cached } = setup();
    const fetcher = vi.fn().mockResolvedValue({ title: 'Inception' });

    await cached('k', { ttl: HOUR }, fetcher);
    const second = await cached('k', { ttl: HOUR }, fetcher);

    expect(second).toEqual({ title: 'Inception' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('süresi dolunca kaynaktan yeniler', async () => {
    const { cached, advance } = setup();
    const fetcher = vi.fn().mockResolvedValueOnce('eski').mockResolvedValueOnce('yeni');

    await cached('k', { ttl: HOUR }, fetcher);
    advance(HOUR + 1);

    expect(await cached('k', { ttl: HOUR }, fetcher)).toBe('yeni');
  });

  it('kaynak çökerse süresi dolmuş kaydı döner (stale-if-error)', async () => {
    const { cached, advance } = setup();
    await cached('k', { ttl: HOUR }, async () => 'eski');
    advance(HOUR + 1);

    const result = await cached('k', { ttl: HOUR }, async () => {
      throw new ProviderError('TMDB', 'unavailable', { status: 503 });
    });

    expect(result).toBe('eski');
  });

  it('kaynak "bulunamadı" derse eski kaydı göstermez', async () => {
    const { cached, advance } = setup();
    await cached('k', { ttl: HOUR }, async () => 'eski');
    advance(HOUR + 1);

    await expect(
      cached('k', { ttl: HOUR }, async () => {
        throw new ProviderError('TMDB', 'not_found', { status: 404 });
      }),
    ).rejects.toMatchObject({ kind: 'not_found' });
  });

  it('elde kayıt yoksa hatayı iletir', async () => {
    const { cached } = setup();
    await expect(
      cached('k', { ttl: HOUR }, async () => {
        throw new ProviderError('TMDB', 'unavailable');
      }),
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it('aynı anda gelen istekler tek bir dış isteği paylaşır', async () => {
    const { cached } = setup();
    const fetcher = vi.fn(
      () => new Promise<string>((resolve) => setTimeout(() => resolve('veri'), 10)),
    );

    const results = await Promise.all([
      cached('k', { ttl: HOUR }, fetcher),
      cached('k', { ttl: HOUR }, fetcher),
      cached('k', { ttl: HOUR }, fetcher),
    ]);

    expect(results).toEqual(['veri', 'veri', 'veri']);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('önbellek deposu çalışmazsa kaynağa gider (önbellek sadece hızlandırıcı)', async () => {
    const broken: CacheStore = {
      get: () => Promise.reject(new Error('veritabanı kapalı')),
      set: () => Promise.reject(new Error('veritabanı kapalı')),
      deleteExpiredBefore: () => Promise.reject(new Error('veritabanı kapalı')),
    };
    const { cached } = createCache(broken);

    expect(await cached('k', { ttl: HOUR }, async () => 'kaynaktan')).toBe('kaynaktan');
  });
});
