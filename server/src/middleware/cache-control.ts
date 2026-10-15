import type { RequestHandler } from 'express';

/**
 * Herkese aynı olan yanıtlar (içerik detayı, arama, trendler) için önbellek başlığı.
 * Tarayıcı kısa süre, CDN (Vercel) `cdnSeconds` boyunca saklar; süre dolunca eski yanıtı
 * hemen verip arkada yeniler (stale-while-revalidate).
 * Kullanıcıya özel veri dönen uçlarda KULLANILMAZ.
 */
export function publicCache(cdnSeconds: number): RequestHandler {
  const value = `public, max-age=300, s-maxage=${cdnSeconds}, stale-while-revalidate=${cdnSeconds * 4}`;
  return (_req, res, next) => {
    res.set('Cache-Control', value);
    next();
  };
}

/** Kullanıcıya özel yanıtlar (oturum, kütüphane...): hiçbir önbellekte saklanmaz. */
export const noStore: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};
