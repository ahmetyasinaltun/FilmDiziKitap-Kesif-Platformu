import { ProviderError } from './http.js';
import { logger } from './logger.js';

export interface CacheEntry {
  data: unknown;
  expiresAt: Date;
}

/** Önbelleğin nerede tutulduğu: canlıda PostgreSQL (ApiCache tablosu), testlerde bellek. */
export interface CacheStore {
  get(key: string): Promise<CacheEntry | null>;
  set(key: string, data: unknown, expiresAt: Date): Promise<void>;
  /** Bu tarihten önce süresi dolmuş kayıtları siler */
  deleteExpiredBefore(date: Date): Promise<number>;
}

export interface CacheOptions {
  /** Saniye cinsinden tazelik süresi */
  ttl: number;
}

/** Süresi dolan kayıt, kaynak çökerse yedek olarak bu kadar daha saklanır. */
const STALE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
/** Her yazmada bu olasılıkla eski kayıt temizliği yapılır (ayrı bir zamanlanmış iş gerekmesin). */
const CLEANUP_PROBABILITY = 0.02;

export function createCache(store: CacheStore, now: () => Date = () => new Date()) {
  /** Aynı anahtar için aynı anda gelen istekler tek bir dış isteği paylaşır. */
  const inFlight = new Map<string, Promise<unknown>>();

  async function readStore(key: string): Promise<CacheEntry | null> {
    try {
      return await store.get(key);
    } catch (error) {
      // Önbellek bir hızlandırıcı; okunamıyorsa doğrudan kaynağa gidilir.
      logger.warn({ err: error, key }, 'Önbellek okunamadı');
      return null;
    }
  }

  async function writeStore(key: string, data: unknown, ttl: number): Promise<void> {
    try {
      await store.set(key, data, new Date(now().getTime() + ttl * 1000));
      if (Math.random() < CLEANUP_PROBABILITY) {
        await store.deleteExpiredBefore(new Date(now().getTime() - STALE_GRACE_MS));
      }
    } catch (error) {
      logger.warn({ err: error, key }, 'Önbelleğe yazılamadı');
    }
  }

  /**
   * Önce önbelleğe bakar; taze kayıt yoksa `fetcher` ile kaynaktan alıp saklar.
   * Kaynak erişilemezse ve elde süresi dolmuş bir kayıt varsa onu döner
   * ("stale-if-error"): eski veri, hata ekranından iyidir.
   *
   * Not: `data` bizim yazdığımız normalize veridir. Biçim değişirse anahtardaki
   * sürüm numarası artırılır, eski kayıtlar böylece kendiliğinden devre dışı kalır.
   */
  async function cached<T>(
    key: string,
    options: CacheOptions,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const entry = await readStore(key);
    if (entry && entry.expiresAt > now()) {
      return entry.data as T;
    }

    const pending = inFlight.get(key);
    if (pending) return pending as Promise<T>;

    const task = (async () => {
      try {
        const data = await fetcher();
        await writeStore(key, data, options.ttl);
        return data;
      } catch (error) {
        if (entry && error instanceof ProviderError && error.kind !== 'not_found') {
          logger.warn(
            { key, provider: error.provider },
            'Kaynak erişilemedi, eski önbellek kullanıldı',
          );
          return entry.data as T;
        }
        throw error;
      } finally {
        inFlight.delete(key);
      }
    })();

    inFlight.set(key, task);
    return task;
  }

  return { cached };
}

/** Testler için bellek içi önbellek. */
export function createMemoryStore(): CacheStore & { entries: Map<string, CacheEntry> } {
  const entries = new Map<string, CacheEntry>();
  return {
    entries,
    get: async (key) => entries.get(key) ?? null,
    set: async (key, data, expiresAt) => {
      entries.set(key, { data, expiresAt });
    },
    deleteExpiredBefore: async (date) => {
      let count = 0;
      for (const [key, entry] of entries) {
        if (entry.expiresAt < date) {
          entries.delete(key);
          count++;
        }
      }
      return count;
    },
  };
}
