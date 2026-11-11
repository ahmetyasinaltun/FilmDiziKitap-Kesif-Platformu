import type { Request } from 'express';
import { ipKeyGenerator, rateLimit, type Options } from 'express-rate-limit';
import { AppError } from '../lib/errors.js';
import { createRateLimitStore } from '../lib/rate-limit-store.js';
import { readSessionToken } from '../lib/session.js';

interface LimitOptions {
  /** Sayaç anahtarlarının öneki; her sınırın sayacı ayrı tutulur */
  name: string;
  windowMinutes: number;
  /** Pencere başına izin verilen istek sayısı */
  limit: number;
  /** true: sadece başarısız istekler (4xx/5xx) sayılır */
  countOnlyFailures?: boolean;
  /**
   * `database` (varsayılan): sayaç PostgreSQL'de, bütün sunucu örnekleri için ortak ve kesin.
   * `memory`: sayaç örneğin belleğinde; her istekte veritabanına yazmaz ama Vercel'de her örnek
   * kendi sayacını tutar, yani yaklaşıktır. Kaba kötüye kullanımı yavaşlatmak için yeterli.
   */
  store?: 'database' | 'memory';
  /** Sınır aşılınca gösterilecek mesajın başı; sonuna bekleme süresi eklenir */
  message?: string;
  /**
   * `ip` (varsayılan): sayaç IP adresine göre. `user`: oturum açmış kullanıcıya göre (yoksa IP).
   * Aynı ağı paylaşanlar (ofis, okul Wi-Fi'si, mobil operatörün ortak adresi) tek IP'den görünür;
   * giriş gerektiren bir uçta IP'ye göre sınır, birinin isteği yüzünden diğerlerini engeller.
   */
  per?: 'ip' | 'user';
}

/** Oturumdaki kullanıcının kimliği; oturum yoksa IP (IPv6'da /56 bloğu, kütüphanenin varsayılanı). */
async function userOrIpKey(req: Request): Promise<string> {
  const token = await readSessionToken(req);
  return token ? `user:${token.userId}` : ipKeyGenerator(req.ip ?? '', 56);
}

/**
 * IP başına istek sınırı. Aşılınca 429 ve kaç dakika beklemek gerektiğini söyleyen Türkçe
 * bir mesaj; hata, diğer hatalar gibi merkezi hata yöneticisinden geçer.
 */
export function limitRequests({
  name,
  windowMinutes,
  limit,
  countOnlyFailures,
  store = 'database',
  message = 'Çok fazla deneme yapıldı.',
  per = 'ip',
}: LimitOptions) {
  const windowMs = windowMinutes * 60 * 1000;
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests: countOnlyFailures ?? false,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Bellek deposu kütüphanenin varsayılanı: `store` verilmezse o kullanılır.
    ...(store === 'database' && { store: createRateLimitStore(name) }),
    ...(per === 'user' && { keyGenerator: userOrIpKey }),
    handler: (_req, res, next, options: Options) => {
      const retryAfter = Number(res.getHeader('Retry-After')) || options.windowMs / 1000;
      const minutes = Math.max(1, Math.ceil(retryAfter / 60));
      next(new AppError(429, 'RATE_LIMITED', `${message} ${minutes} dakika sonra tekrar dene.`));
    },
  });
}
