/**
 * OMDb: IMDb, Rotten Tomatoes ve Metacritic puanları. Ücretsiz planda günde 1000 istek;
 * bu yüzden 7 gün önbellekte tutulur. Belgeler: https://www.omdbapi.com/
 */
import { z } from 'zod';
import { env } from '../../config/env.js';
import type { ExternalRatings } from '../../domain/content.js';
import { cached } from '../../lib/api-cache.js';
import { fetchJson, ProviderError } from '../../lib/http.js';

const VERSION = 1;

const omdbSchema = z.object({
  Response: z.enum(['True', 'False']),
  Error: z.string().optional(),
  imdbRating: z.string().optional(),
  imdbVotes: z.string().optional(),
  Ratings: z.array(z.object({ Source: z.string(), Value: z.string() })).optional(),
});
export type OmdbResponse = z.output<typeof omdbSchema>;

/** OMDb eksik değerleri "N/A" olarak yazar. */
function parseNumber(value: string | undefined): number | null {
  if (!value || value === 'N/A') return null;
  const number = Number.parseFloat(value.replaceAll(',', ''));
  return Number.isFinite(number) ? number : null;
}

export function toExternalRatings(raw: OmdbResponse): ExternalRatings {
  const source = (name: string) => raw.Ratings?.find((rating) => rating.Source === name)?.Value;
  const imdbRating = parseNumber(raw.imdbRating);
  return {
    imdb: imdbRating === null ? null : { rating: imdbRating, votes: parseNumber(raw.imdbVotes) },
    // "86%" → 86
    rottenTomatoes: parseNumber(source('Rotten Tomatoes')?.replace('%', '')),
    // "74/100" → 74
    metacritic: parseNumber(source('Metacritic')?.split('/')[0]),
  };
}

const EMPTY: ExternalRatings = { imdb: null, rottenTomatoes: null, metacritic: null };

export function getExternalRatings(imdbId: string): Promise<ExternalRatings> {
  return cached(`omdb:v${VERSION}:${imdbId}`, { ttl: 7 * 24 * 60 * 60 }, async () => {
    const url = new URL('https://www.omdbapi.com/');
    url.search = new URLSearchParams({ apikey: env.OMDB_API_KEY, i: imdbId }).toString();
    // OMDb kota dolunca veya anahtar geçersizse HTTP 401 döner → "unavailable".
    const raw = await fetchJson({ provider: 'OMDb', url, schema: omdbSchema });
    if (raw.Response === 'False') {
      // "Incorrect IMDb ID" gibi: bu içerik için puan yok. Boş sonuç önbelleğe alınır ki tekrar sorulmasın.
      if (raw.Error?.toLowerCase().includes('not found') || raw.Error?.includes('Incorrect')) {
        return EMPTY;
      }
      throw new ProviderError('OMDb', 'unavailable');
    }
    return toExternalRatings(raw);
  });
}
