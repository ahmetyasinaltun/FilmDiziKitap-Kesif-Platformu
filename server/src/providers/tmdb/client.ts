import type { z } from 'zod';
import { env } from '../../config/env.js';
import { fetchJson } from '../../lib/http.js';

const BASE_URL = 'https://api.themoviedb.org/3';

/**
 * TMDB'ye GET isteği. Varsayılan dil Türkçe; kimlik doğrulama v4 "Read Access Token" ile
 * (Authorization başlığında, adreste anahtar yok).
 */
export function tmdbGet<S extends z.ZodType>(
  path: string,
  schema: S,
  params: Record<string, string> = {},
): Promise<z.output<S>> {
  const url = new URL(`${BASE_URL}${path}`);
  url.search = new URLSearchParams({ language: 'tr-TR', ...params }).toString();
  return fetchJson({
    provider: 'TMDB',
    url,
    schema,
    headers: { Authorization: `Bearer ${env.TMDB_API_TOKEN}` },
  });
}
