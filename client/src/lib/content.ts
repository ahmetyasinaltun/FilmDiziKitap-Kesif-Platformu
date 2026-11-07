/**
 * Sunucunun içerik tipleri. `export type` derlemede silinir: client'a sunucu kodu girmez,
 * ama iki taraf aynı tanımı kullandığı için API biçimi değişince tip hatası burada görünür.
 */
export type {
  CastMember,
  CrewMember,
  MovieDetail,
  Paginated,
  TvDetail,
  WatchProvider,
  WatchProviders,
} from '../../../server/src/domain/content';

import type { ContentSummary, MovieDetail, TvDetail } from '../../../server/src/domain/content';

export type TitleType = 'movie' | 'tv';
export type TitleDetail = MovieDetail | TvDetail;
/** Film ve dizi kartı; kitaplar ayrı bölümde gösterilir. */
export type TitleSummary = ContentSummary & { type: TitleType };

const TITLE_PATHS: Record<TitleType, string> = { movie: 'film', tv: 'dizi' };

export function titlePath(type: TitleType, id: string): string {
  return `/${TITLE_PATHS[type]}/${encodeURIComponent(id)}`;
}
