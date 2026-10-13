/**
 * Google Books: sadece kitapların Türkçe açıklaması (ve önizleme bağlantısı) için.
 * Arama altyapısı sık sık 503 veriyor (2026-10 ölçümü: isteklerin ~%80'i); bu yüzden
 * çağrı her zaman isteğe bağlı, sonuç 30 gün önbellekte. Belgeler: https://developers.google.com/books
 */
import { z } from 'zod';
import { env } from '../../config/env.js';
import { cached } from '../../lib/api-cache.js';
import { fetchJson } from '../../lib/http.js';
import { lenientArray, optionalText, text } from '../../lib/schema.js';
import { normalizeForMatch } from '../openlibrary/mappers.js';

const VERSION = 1;

const volumesSchema = z.object({
  items: lenientArray(
    z.object({
      volumeInfo: z.object({
        title: text,
        language: optionalText,
        description: optionalText,
        previewLink: optionalText,
      }),
    }),
  ).optional(),
});
type Volume = NonNullable<z.output<typeof volumesSchema>['items']>[number]['volumeInfo'];

export interface GoogleBookMatch {
  title: string;
  description: string | null;
  previewLink: string | null;
}

/** Bazı açıklamalar HTML içerir (<p>, <br>, <b>); düz metne çevrilir. */
export function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Türkçe ve başlığı eşleşen cilt seçilir; açıklaması olan önde. Eşleşme aksan ve
 * noktalamadan bağımsızdır ("Ucurtma Avcisi" = "Uçurtma Avcısı").
 */
export function pickVolume(volumes: Volume[], title: string): GoogleBookMatch | null {
  const wanted = normalizeForMatch(title);
  const candidates = volumes.filter(
    (volume) => volume.language === 'tr' && normalizeForMatch(volume.title) === wanted,
  );
  const best = candidates.find((volume) => volume.description) ?? candidates[0];
  if (!best) return null;
  return {
    title: best.title,
    description: best.description ? stripHtml(best.description) : null,
    // Google bazen http:// bağlantı veriyor
    previewLink: best.previewLink?.replace(/^http:\/\//, 'https://') ?? null,
  };
}

/** Önbellekte `null` saklanamadığı için sonuç bir zarf içinde: "bulunamadı" da önbelleğe alınır. */
export function findTurkishVolume(
  workId: string,
  title: string,
  author: string | null,
): Promise<{ volume: GoogleBookMatch | null }> {
  return cached(`gb:v${VERSION}:work:${workId}`, { ttl: 30 * 24 * 60 * 60 }, async () => {
    const lastName = author?.split(' ').pop();
    const url = new URL('https://www.googleapis.com/books/v1/volumes');
    url.search = new URLSearchParams({
      q: lastName ? `intitle:${title} inauthor:${lastName}` : `intitle:${title}`,
      langRestrict: 'tr',
      printType: 'books',
      maxResults: '10',
      key: env.GOOGLE_BOOKS_API_KEY,
    }).toString();
    const raw = await fetchJson({ provider: 'Google Books', url, schema: volumesSchema });
    return {
      volume: pickVolume(
        (raw.items ?? []).map((item) => item.volumeInfo),
        title,
      ),
    };
  });
}
