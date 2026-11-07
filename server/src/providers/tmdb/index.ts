/**
 * TMDB servis katmanı: istek + dönüştürme + önbellek. Route'lar sadece bu fonksiyonları kullanır.
 */
import type {
  ContentSummary,
  MovieDetail,
  Paginated,
  PersonDetail,
  SearchResult,
  SeasonDetail,
  TvDetail,
} from '../../domain/content.js';
import { cached } from '../../lib/api-cache.js';
import { tmdbGet } from './client.js';
import {
  toMovieDetail,
  toMovieSummary,
  toPersonDetail,
  toSearchResult,
  toSeasonDetail,
  toTvDetail,
  toTvSummary,
} from './mappers.js';
import {
  biographyOnlySchema,
  movieDetailSchema,
  movieItemSchema,
  multiItemSchema,
  overviewOnlySchema,
  paginatedSchema,
  personItemSchema,
  personDetailSchema,
  seasonDetailSchema,
  tvDetailSchema,
  tvItemSchema,
} from './schemas.js';

/** Normalize biçim değişirse artırılır; eski önbellek kayıtları kendiliğinden devre dışı kalır. */
const VERSION = 3;
const key = (...parts: (string | number)[]) => ['tmdb', `v${VERSION}`, ...parts].join(':');

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

const TITLE_APPEND = 'videos,recommendations,similar,external_ids,watch/providers';
/** `language=tr-TR` videoları da Türkçeye süzer; fragman için İngilizceye de izin ver. */
const VIDEO_LANGUAGES = 'tr,en';

/** Türkçe açıklama yoksa İngilizcesi (Türkçe çevirisi olmayan yapımlarda sık). */
async function englishOverview(path: string): Promise<string | null> {
  const { overview } = await tmdbGet(path, overviewOnlySchema, { language: 'en-US' });
  return overview;
}

export function getMovie(id: number): Promise<MovieDetail> {
  return cached(key('movie', id), { ttl: DAY }, async () => {
    const raw = await tmdbGet(`/movie/${id}`, movieDetailSchema, {
      append_to_response: `${TITLE_APPEND},credits,release_dates`,
      include_video_language: VIDEO_LANGUAGES,
    });
    const movie = toMovieDetail(raw);
    movie.overview ??= await englishOverview(`/movie/${id}`);
    return movie;
  });
}

export function getTv(id: number): Promise<TvDetail> {
  return cached(key('tv', id), { ttl: DAY }, async () => {
    const raw = await tmdbGet(`/tv/${id}`, tvDetailSchema, {
      append_to_response: `${TITLE_APPEND},aggregate_credits,content_ratings`,
      include_video_language: VIDEO_LANGUAGES,
    });
    const tv = toTvDetail(raw);
    tv.overview ??= await englishOverview(`/tv/${id}`);
    return tv;
  });
}

export function getSeason(showId: number, season: number): Promise<SeasonDetail> {
  return cached(key('tv', showId, 'season', season), { ttl: DAY }, async () =>
    toSeasonDetail(showId, await tmdbGet(`/tv/${showId}/season/${season}`, seasonDetailSchema)),
  );
}

export function getPerson(id: number): Promise<PersonDetail> {
  return cached(key('person', id), { ttl: 7 * DAY }, async () => {
    const raw = await tmdbGet(`/person/${id}`, personDetailSchema, {
      append_to_response: 'combined_credits',
    });
    const person = toPersonDetail(raw);
    if (!person.biography) {
      const english = await tmdbGet(`/person/${id}`, biographyOnlySchema, { language: 'en-US' });
      person.biography = english.biography;
    }
    return person;
  });
}

/** Türe özel aramalarda TMDB `media_type` göndermez; tek dönüştürücü kullanmak için eklenir. */
const searchItemSchemas = {
  multi: multiItemSchema,
  movie: movieItemSchema.transform((item) => ({ ...item, media_type: 'movie' as const })),
  tv: tvItemSchema.transform((item) => ({ ...item, media_type: 'tv' as const })),
  person: personItemSchema.transform((item) => ({ ...item, media_type: 'person' as const })),
};
export type TmdbSearchKind = keyof typeof searchItemSchemas;

/** Film, dizi ve kişi araması: "multi" hepsini birden, diğerleri tek türü arar. */
export function searchTmdb(
  kind: TmdbSearchKind,
  query: string,
  page: number,
): Promise<Paginated<SearchResult>> {
  const normalized = query.trim().toLocaleLowerCase('tr-TR');
  return cached(key('search', kind, normalized, page), { ttl: 6 * HOUR }, async () => {
    const raw = await tmdbGet(`/search/${kind}`, paginatedSchema(searchItemSchemas[kind]), {
      query: normalized,
      page: String(page),
      include_adult: 'false',
    });
    return {
      page: raw.page,
      totalPages: raw.total_pages,
      totalResults: raw.total_results,
      results: raw.results.map(toSearchResult),
    };
  });
}

export type TrendingType = 'all' | 'movie' | 'tv';
export type TrendingWindow = 'day' | 'week';

/** Trendler; "all" kişileri de döndürür, onlar ayıklanır. */
export function getTrending(type: TrendingType, window: TrendingWindow): Promise<ContentSummary[]> {
  return cached(key('trending', type, window), { ttl: 3 * HOUR }, async () => {
    const raw = await tmdbGet(`/trending/${type}/${window}`, paginatedSchema(multiItemSchema));
    return raw.results.flatMap((item): ContentSummary[] => {
      const options = { withOverview: true, withBackdrop: true };
      if (item.media_type === 'movie') return [toMovieSummary(item, options)];
      if (item.media_type === 'tv') return [toTvSummary(item, options)];
      return [];
    });
  });
}

/** Türkiye'de vizyondaki filmler */
export function getNowPlaying(page: number): Promise<Paginated<ContentSummary>> {
  return cached(key('now-playing', 'TR', page), { ttl: 12 * HOUR }, async () => {
    const raw = await tmdbGet('/movie/now_playing', paginatedSchema(movieItemSchema), {
      region: 'TR',
      page: String(page),
    });
    return {
      page: raw.page,
      totalPages: raw.total_pages,
      totalResults: raw.total_results,
      results: raw.results.map((item) =>
        toMovieSummary(item, { withOverview: true, withBackdrop: true }),
      ),
    };
  });
}

/**
 * Popüler diziler (ana sayfa için). TMDB'nin hazır "/tv/popular" listesi talk show ve
 * düşük oylu yapımlarla dolu; bu yüzden filtreli keşif kullanılır: talk show (10767),
 * haber (10763), reality (10764) ve pembe dizi (10766) hariç, en az 100 oy.
 */
export function getPopularTv(page: number): Promise<Paginated<ContentSummary>> {
  return cached(key('popular-tv', page), { ttl: 12 * HOUR }, async () => {
    const raw = await tmdbGet('/discover/tv', paginatedSchema(tvItemSchema), {
      page: String(page),
      sort_by: 'popularity.desc',
      without_genres: '10767,10763,10764,10766',
      'vote_count.gte': '100',
      include_adult: 'false',
    });
    return {
      page: raw.page,
      totalPages: raw.total_pages,
      totalResults: raw.total_results,
      results: raw.results.map((item) => toTvSummary(item, { withOverview: true })),
    };
  });
}
