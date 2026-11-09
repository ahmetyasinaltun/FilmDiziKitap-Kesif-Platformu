import type { RequestHandler } from 'express';
import { AppError } from '../lib/errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Veri değiştiren isteklerin (POST, PUT, DELETE) bu siteden geldiğini doğrular: CSRF'e karşı
 * SameSite=Lax cookie'nin üstüne ikinci bir katman.
 *
 * Tarayıcı, başka bir siteden yapılan istekte `Sec-Fetch-Site: cross-site` ve kendi adresini
 * `Origin` başlığında gönderir; bunlar sayfadaki koddan değiştirilemez. Başlık hiç yoksa istek
 * tarayıcıdan gelmiyordur (curl, testler) ve kurbanın cookie'sini taşıyamaz; geçirilir.
 */
export const sameOriginOnly: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const crossSite = req.get('sec-fetch-site') === 'cross-site';
  const origin = req.get('origin');
  if (crossSite || (origin !== undefined && originHost(origin) !== req.host)) {
    return next(
      new AppError(
        403,
        'CROSS_SITE_REQUEST',
        'Bu istek başka bir siteden geldiği için reddedildi.',
      ),
    );
  }
  next();
};

/** "https://ornek.com:8080" → "ornek.com:8080"; geçersiz ya da "null" köken eşleşmez. */
function originHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}
