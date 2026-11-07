/**
 * TMDB ham verisini normalize tiplere çeviren saf fonksiyonlar (yan etkisiz, kolay test edilir).
 */
import type {
  CastMember,
  ContentSummary,
  CrewMember,
  MovieDetail,
  PersonCredit,
  PersonDetail,
  PersonSummary,
  SearchResult,
  SeasonDetail,
  TvDetail,
  Video,
  WatchProvider,
  WatchProviders,
} from '../../domain/content.js';
import type {
  TmdbCountryProviders,
  TmdbCrew,
  TmdbMovieDetail,
  TmdbMovieItem,
  TmdbMultiItem,
  TmdbPersonDetail,
  TmdbSeasonDetail,
  TmdbTvDetail,
  TmdbTvItem,
  TmdbVideo,
} from './schemas.js';

/** "Nerede izlenir" ve yaş sınırı için ülke */
const COUNTRY = 'TR';
const CAST_LIMIT = 20;
const RECOMMENDATION_LIMIT = 12;
const KNOWN_FOR_LIMIT = 8;
/** Kişi sayfasında gösterilmeyen türler: talk show (10767) ve haber (10763) */
const HIDDEN_CREDIT_GENRES = new Set([10767, 10763]);
const WRITER_JOBS = new Set(['Screenplay', 'Writer', 'Novel', 'Story', 'Author']);

export function yearOf(date: string | null): number | null {
  const year = date ? Number.parseInt(date.slice(0, 4), 10) : NaN;
  return Number.isFinite(year) ? year : null;
}

/** Hiç oy yoksa 0 puan yanıltıcı olur; null döner. */
export function ratingOf(average: number, votes: number): number | null {
  return votes > 0 ? Math.round(average * 10) / 10 : null;
}

function originalIfDifferent(title: string, original: string | null): string | null {
  return original && original !== title ? original : null;
}

type SummaryOptions = { withOverview?: boolean; withBackdrop?: boolean };

export function toMovieSummary(
  item: TmdbMovieItem,
  options: SummaryOptions = {},
): ContentSummary & { type: 'movie' } {
  return {
    type: 'movie',
    id: String(item.id),
    title: item.title,
    originalTitle: originalIfDifferent(item.title, item.original_title),
    year: yearOf(item.release_date),
    poster: item.poster_path,
    overview: options.withOverview ? item.overview : null,
    rating: ratingOf(item.vote_average, item.vote_count),
    ...(options.withBackdrop ? { backdrop: item.backdrop_path } : {}),
  };
}

export function toTvSummary(
  item: TmdbTvItem,
  options: SummaryOptions = {},
): ContentSummary & { type: 'tv' } {
  return {
    type: 'tv',
    id: String(item.id),
    title: item.name,
    originalTitle: originalIfDifferent(item.name, item.original_name),
    year: yearOf(item.first_air_date),
    poster: item.poster_path,
    overview: options.withOverview ? item.overview : null,
    rating: ratingOf(item.vote_average, item.vote_count),
    ...(options.withBackdrop ? { backdrop: item.backdrop_path } : {}),
  };
}

export function toSearchResult(item: TmdbMultiItem): SearchResult {
  switch (item.media_type) {
    case 'movie':
      return toMovieSummary(item, { withOverview: true, withBackdrop: true });
    case 'tv':
      return toTvSummary(item, { withOverview: true, withBackdrop: true });
    case 'person':
      return {
        type: 'person',
        id: String(item.id),
        name: item.name,
        profile: item.profile_path,
        department: item.known_for_department,
      } satisfies PersonSummary;
  }
}

const TRAILER_TYPES = ['Trailer', 'Teaser'];
const LANGUAGE_PREFERENCE = ['tr', 'en'];

/**
 * Fragman seçimi: sadece YouTube; önce "Trailer", sonra "Teaser"; önce Türkçe, sonra İngilizce;
 * resmi olan ve daha yeni olan önde.
 */
export function pickTrailer(videos: TmdbVideo[]): Video | null {
  const rank = (video: TmdbVideo) => {
    const language = LANGUAGE_PREFERENCE.indexOf(video.iso_639_1 ?? '');
    return [
      TRAILER_TYPES.indexOf(video.type),
      language === -1 ? LANGUAGE_PREFERENCE.length : language,
      video.official ? 0 : 1,
    ];
  };
  const best = videos
    .filter((video) => video.site === 'YouTube' && TRAILER_TYPES.includes(video.type))
    .sort((a, b) => {
      const [ra, rb] = [rank(a), rank(b)];
      for (let i = 0; i < ra.length; i++) {
        const diff = (ra[i] ?? 0) - (rb[i] ?? 0);
        if (diff !== 0) return diff;
      }
      return (b.published_at ?? '').localeCompare(a.published_at ?? '');
    })[0];
  return best ? { key: best.key, name: best.name, language: best.iso_639_1 } : null;
}

export function mapWatchProviders(
  results: Record<string, TmdbCountryProviders> | undefined,
): WatchProviders | null {
  const country = results?.[COUNTRY];
  if (!country) return null;

  const toList = (...groups: (TmdbCountryProviders['buy'] | undefined)[]): WatchProvider[] => {
    const seen = new Set<number>();
    return groups
      .flatMap((group) => group ?? [])
      .sort((a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99))
      .filter((provider) => !seen.has(provider.provider_id) && seen.add(provider.provider_id))
      .map((provider) => ({
        id: provider.provider_id,
        name: provider.provider_name,
        logo: provider.logo_path,
      }));
  };

  const providers: WatchProviders = {
    link: country.link,
    stream: toList(country.flatrate),
    free: toList(country.free, country.ads),
    rent: toList(country.rent),
    buy: toList(country.buy),
  };
  const isEmpty = [providers.stream, providers.free, providers.rent, providers.buy].every(
    (list) => list.length === 0,
  );
  return isEmpty ? null : providers;
}

function uniqueCrew(crew: TmdbCrew[], jobs: Set<string>): CrewMember[] {
  const seen = new Set<number>();
  return crew
    .filter((member) => jobs.has(member.job) && !seen.has(member.id) && seen.add(member.id))
    .map((member) => ({ id: String(member.id), name: member.name, job: member.job }));
}

function byOrder(a: { order?: number | null }, b: { order?: number | null }) {
  return (a.order ?? 999) - (b.order ?? 999);
}

/** Öneri yoksa (az bilinen yapımlarda olur) benzer yapımlara düşülür. */
function pickRecommendations<T>(recommendations: T[] = [], similar: T[] = []): T[] {
  return (recommendations.length > 0 ? recommendations : similar).slice(0, RECOMMENDATION_LIMIT);
}

export function toMovieDetail(raw: TmdbMovieDetail): MovieDetail {
  const crew = raw.credits?.crew ?? [];
  const certification =
    raw.release_dates?.results
      .find((entry) => entry.iso_3166_1 === COUNTRY)
      ?.release_dates.find((release) => release.certification)?.certification ?? null;

  return {
    ...toMovieSummary(raw, { withOverview: true }),
    tagline: raw.tagline,
    backdrop: raw.backdrop_path,
    genres: raw.genres,
    voteCount: raw.vote_count,
    imdbId: raw.imdb_id ?? raw.external_ids?.imdb_id ?? null,
    certification,
    trailer: pickTrailer(raw.videos?.results ?? []),
    cast: [...(raw.credits?.cast ?? [])]
      .sort(byOrder)
      .slice(0, CAST_LIMIT)
      .map((member): CastMember => ({
        id: String(member.id),
        name: member.name,
        character: member.character,
        profile: member.profile_path,
      })),
    recommendations: pickRecommendations(raw.recommendations?.results, raw.similar?.results).map(
      (item) => toMovieSummary(item),
    ),
    watchProviders: mapWatchProviders(raw['watch/providers']?.results),
    externalRatings: null,
    releaseDate: raw.release_date,
    runtime: raw.runtime || null,
    directors: uniqueCrew(crew, new Set(['Director'])),
    writers: uniqueCrew(crew, WRITER_JOBS),
    collection: raw.belongs_to_collection
      ? { id: String(raw.belongs_to_collection.id), name: raw.belongs_to_collection.name }
      : null,
  };
}

export function toTvDetail(raw: TmdbTvDetail): TvDetail {
  const runtimes = raw.episode_run_time ?? [];
  const seasons = [...(raw.seasons ?? [])].sort(
    // Özel bölümler (0. sezon) sona
    (a, b) => (a.season_number || Infinity) - (b.season_number || Infinity),
  );
  const next = raw.next_episode_to_air;

  return {
    ...toTvSummary(raw, { withOverview: true }),
    tagline: raw.tagline,
    backdrop: raw.backdrop_path,
    genres: raw.genres,
    voteCount: raw.vote_count,
    imdbId: raw.external_ids?.imdb_id ?? null,
    certification:
      raw.content_ratings?.results.find((entry) => entry.iso_3166_1 === COUNTRY)?.rating ?? null,
    trailer: pickTrailer(raw.videos?.results ?? []),
    cast: [...(raw.aggregate_credits?.cast ?? [])]
      .sort(byOrder)
      .slice(0, CAST_LIMIT)
      .map((member): CastMember => ({
        id: String(member.id),
        name: member.name,
        character:
          [...member.roles].sort((a, b) => b.episode_count - a.episode_count)[0]?.character ?? null,
        profile: member.profile_path,
        episodeCount: member.total_episode_count,
      })),
    recommendations: pickRecommendations(raw.recommendations?.results, raw.similar?.results).map(
      (item) => toTvSummary(item),
    ),
    watchProviders: mapWatchProviders(raw['watch/providers']?.results),
    externalRatings: null,
    firstAirDate: raw.first_air_date,
    lastAirDate: raw.last_air_date,
    status: raw.status,
    inProduction: raw.in_production ?? false,
    seasonCount: raw.number_of_seasons,
    episodeCount: raw.number_of_episodes,
    // TMDB `episode_run_time` alanını çoğu dizide artık doldurmuyor; son bölümün süresi yedek.
    episodeRuntime:
      runtimes.length > 0
        ? Math.round(runtimes.reduce((sum, value) => sum + value, 0) / runtimes.length)
        : raw.last_episode_to_air?.runtime || null,
    creators: (raw.created_by ?? []).map((creator) => ({
      id: String(creator.id),
      name: creator.name,
      job: 'Creator',
    })),
    networks: (raw.networks ?? []).map((network) => ({
      id: network.id,
      name: network.name,
      logo: network.logo_path,
    })),
    seasons: seasons.map((season) => ({
      number: season.season_number,
      name: season.name,
      episodeCount: season.episode_count,
      airDate: season.air_date,
      poster: season.poster_path,
    })),
    nextEpisode: next
      ? {
          season: next.season_number,
          number: next.episode_number,
          name: next.name,
          airDate: next.air_date,
        }
      : null,
  };
}

export function toSeasonDetail(showId: number, raw: TmdbSeasonDetail): SeasonDetail {
  return {
    showId: String(showId),
    number: raw.season_number,
    name: raw.name,
    overview: raw.overview,
    airDate: raw.air_date,
    poster: raw.poster_path,
    episodes: raw.episodes.map((episode) => ({
      number: episode.episode_number,
      name: episode.name,
      overview: episode.overview,
      airDate: episode.air_date,
      runtime: episode.runtime ?? null,
      still: episode.still_path,
      rating: ratingOf(episode.vote_average, episode.vote_count),
    })),
  };
}

type RawCredit = NonNullable<TmdbPersonDetail['combined_credits']>['cast'][number];

const SELF_ROLE = /^(self|himself|herself|themselves)\b/i;

export function toPersonDetail(raw: TmdbPersonDetail): PersonDetail {
  const grouped = new Map<string, { raw: RawCredit; roles: Set<string> }>();

  const add = (credit: RawCredit, role: string | null) => {
    if (credit.genre_ids?.some((genre) => HIDDEN_CREDIT_GENRES.has(genre))) return;
    if (credit.media_type === 'tv' && role && SELF_ROLE.test(role)) return;
    const key = `${credit.media_type}:${credit.id}`;
    const entry = grouped.get(key) ?? { raw: credit, roles: new Set<string>() };
    if (role) entry.roles.add(role);
    grouped.set(key, entry);
  };
  for (const credit of raw.combined_credits?.cast ?? []) add(credit, credit.character);
  for (const credit of raw.combined_credits?.crew ?? []) add(credit, credit.job);

  const entries = [...grouped.values()];
  const summaryOf = (credit: RawCredit) =>
    credit.media_type === 'movie' ? toMovieSummary(credit) : toTvSummary(credit);
  const dateOf = (credit: RawCredit) =>
    (credit.media_type === 'movie' ? credit.release_date : credit.first_air_date) ?? '';

  const credits: PersonCredit[] = entries
    .sort((a, b) => dateOf(b.raw).localeCompare(dateOf(a.raw)))
    .map((entry) => ({ content: summaryOf(entry.raw), roles: [...entry.roles] }));

  const knownFor = [...entries]
    .sort((a, b) => b.raw.vote_count - a.raw.vote_count)
    .slice(0, KNOWN_FOR_LIMIT)
    .map((entry) => summaryOf(entry.raw));

  return {
    type: 'person',
    id: String(raw.id),
    name: raw.name,
    biography: raw.biography,
    birthday: raw.birthday,
    deathday: raw.deathday,
    placeOfBirth: raw.place_of_birth,
    profile: raw.profile_path,
    department: raw.known_for_department,
    imdbId: raw.imdb_id,
    knownFor,
    credits,
  };
}
