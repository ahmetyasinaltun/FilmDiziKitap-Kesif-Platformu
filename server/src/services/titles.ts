import type { ExternalRatings, MovieDetail, TvDetail } from '../domain/content.js';
import { ProviderError } from '../lib/http.js';
import { logger } from '../lib/logger.js';
import { getExternalRatings } from '../providers/omdb/index.js';
import { getMovie, getTv } from '../providers/tmdb/index.js';

/**
 * Detaya OMDb puanlarını ekler. OMDb erişilemezse (kota, kesinti) detay yine döner,
 * sadece `externalRatings` null kalır: bir kaynağın çökmesi bütün sayfayı düşürmez.
 */
async function withExternalRatings<
  T extends { imdbId: string | null; externalRatings: ExternalRatings | null },
>(detail: T): Promise<T> {
  if (!detail.imdbId) return detail;
  try {
    return { ...detail, externalRatings: await getExternalRatings(detail.imdbId) };
  } catch (error) {
    if (!(error instanceof ProviderError)) throw error;
    logger.warn({ provider: error.provider, kind: error.kind }, 'Dış puanlar alınamadı');
    return detail;
  }
}

export async function getMovieDetail(id: number): Promise<MovieDetail> {
  return withExternalRatings(await getMovie(id));
}

export async function getTvDetail(id: number): Promise<TvDetail> {
  return withExternalRatings(await getTv(id));
}
