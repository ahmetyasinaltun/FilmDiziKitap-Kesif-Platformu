/**
 * Sunucunun içerik tipleri. `export type` derlemede silinir: client'a sunucu kodu girmez,
 * ama iki taraf aynı tanımı kullandığı için API biçimi değişince tip hatası burada görünür.
 */
export type {
  AuthorDetail,
  BookDetail,
  CastMember,
  ContentSummary,
  CrewMember,
  MediaType,
  MovieDetail,
  Paginated,
  PersonCredit,
  PersonDetail,
  PersonSummary,
  SearchResult,
  TvDetail,
  WatchProvider,
  WatchProviders,
} from '../../../server/src/domain/content';

export type {
  ContentRef,
  LibraryEntry,
  LibraryItem,
  LibraryStatus,
} from '../../../server/src/domain/library';
export type { SessionUser } from '../../../server/src/domain/user';

import type {
  ContentSummary,
  MediaType,
  MovieDetail,
  TvDetail,
} from '../../../server/src/domain/content';

export type TitleType = 'movie' | 'tv';
export type TitleDetail = MovieDetail | TvDetail;
/** Film ve dizi kartı; kitaplar ayrı bölümde gösterilir. */
export type TitleSummary = ContentSummary & { type: TitleType };

const CONTENT_PATHS: Record<MediaType, string> = { movie: 'film', tv: 'dizi', book: 'kitap' };

export function contentPath(type: MediaType, id: string): string {
  return `/${CONTENT_PATHS[type]}/${encodeURIComponent(id)}`;
}

export function authorPath(id: string): string {
  return `/yazar/${encodeURIComponent(id)}`;
}

export function personPath(id: string): string {
  return `/kisi/${encodeURIComponent(id)}`;
}
