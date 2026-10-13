import { z } from 'zod';

/** Route parametreleri ve sorgu dizeleri için ortak şemalar. Hatalı girdi 400 olur. */

export const tmdbId = z.coerce.number().int().positive().max(2_147_483_647);

export const idParams = z.object({ id: tmdbId });

/** TMDB en fazla 500 sayfa döndürür. */
export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
});
