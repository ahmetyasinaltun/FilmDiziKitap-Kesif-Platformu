import type { z } from 'zod';
import { env } from '../../config/env.js';
import { fetchJson } from '../../lib/http.js';

const BASE_URL = 'https://openlibrary.org';

/**
 * Open Library'ye GET isteği. Anahtar istemez ama kim olduğumuzu bildiren bir
 * User-Agent ister; bunu gönderen istemcilere daha yüksek istek sınırı tanır.
 */
export function olGet<S extends z.ZodType>(
  path: string,
  schema: S,
  params: Record<string, string> = {},
): Promise<z.output<S>> {
  const url = new URL(`${BASE_URL}${path}`);
  url.search = new URLSearchParams(params).toString();
  return fetchJson({
    provider: 'Open Library',
    url,
    schema,
    headers: { 'User-Agent': env.APP_USER_AGENT },
    // Arama uçları bazen 1-2 saniye sürüyor
    timeoutMs: 10_000,
  });
}

export const openLibraryUrl = (path: string) => `${BASE_URL}${path}`;
