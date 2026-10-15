import { z } from 'zod';

/** Route parametreleri ve sorgu dizeleri için ortak şemalar. Hatalı girdi 400 olur. */

export const tmdbId = z.coerce.number().int().positive().max(2_147_483_647);

export const idParams = z.object({ id: tmdbId });

/** TMDB en fazla 500 sayfa döndürür. */
export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
});

/** Open Library eser kimliği: "OL1168083W" */
export const bookId = z.string().regex(/^OL\d+W$/, 'Geçersiz kitap kimliği');

/** `/:type/:id` biçimindeki içerik adresleri (kütüphane, liste, yorum). Kimlik türe göre doğrulanır. */
export const contentRefParams = z.discriminatedUnion('type', [
  z.object({ type: z.enum(['movie', 'tv']), id: tmdbId.transform(String) }),
  z.object({ type: z.literal('book'), id: bookId }),
]);
