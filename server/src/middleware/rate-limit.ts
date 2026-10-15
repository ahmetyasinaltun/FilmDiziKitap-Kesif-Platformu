import { rateLimit, type Options } from 'express-rate-limit';
import { AppError } from '../lib/errors.js';
import { createRateLimitStore } from '../lib/rate-limit-store.js';

interface LimitOptions {
  /** Sayaç anahtarlarının öneki; her sınırın sayacı ayrı tutulur */
  name: string;
  windowMinutes: number;
  /** Pencere başına izin verilen istek sayısı */
  limit: number;
  /** true: sadece başarısız istekler (4xx/5xx) sayılır */
  countOnlyFailures?: boolean;
}

/**
 * IP başına istek sınırı. Aşılınca 429 ve kaç dakika beklemek gerektiğini söyleyen Türkçe
 * bir mesaj; hata, diğer hatalar gibi merkezi hata yöneticisinden geçer.
 */
export function limitRequests({ name, windowMinutes, limit, countOnlyFailures }: LimitOptions) {
  const windowMs = windowMinutes * 60 * 1000;
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests: countOnlyFailures ?? false,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    store: createRateLimitStore(name),
    handler: (_req, res, next, options: Options) => {
      const retryAfter = Number(res.getHeader('Retry-After')) || options.windowMs / 1000;
      const minutes = Math.max(1, Math.ceil(retryAfter / 60));
      next(
        new AppError(
          429,
          'RATE_LIMITED',
          `Çok fazla deneme yapıldı. ${minutes} dakika sonra tekrar dene.`,
        ),
      );
    },
  });
}
