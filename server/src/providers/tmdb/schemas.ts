/**
 * TMDB ham yanıt şemaları. Sadece kullandığımız alanlar tanımlı; gerisi ayıklanır.
 * Belgeler: https://developer.themoviedb.org/reference
 */
import { z } from 'zod';
import { lenientArray, optionalText, text } from '../../lib/schema.js';

const count = z
  .number()
  .nullish()
  .transform((value) => value ?? 0);

export const movieItemSchema = z.object({
  id: z.number(),
  title: text,
  original_title: optionalText,
  overview: optionalText,
  poster_path: optionalText,
  release_date: optionalText,
  vote_average: count,
  vote_count: count,
  genre_ids: z.array(z.number()).nullish(),
});

export const tvItemSchema = z.object({
  id: z.number(),
  name: text,
  original_name: optionalText,
  overview: optionalText,
  poster_path: optionalText,
  first_air_date: optionalText,
  vote_average: count,
  vote_count: count,
  genre_ids: z.array(z.number()).nullish(),
});

export const personItemSchema = z.object({
  id: z.number(),
  name: text,
  profile_path: optionalText,
  known_for_department: optionalText,
});

export type TmdbMovieItem = z.output<typeof movieItemSchema>;
export type TmdbTvItem = z.output<typeof tvItemSchema>;

/** `/search/multi` ve `/trending/all` gibi karışık listeler */
export const multiItemSchema = z.discriminatedUnion('media_type', [
  movieItemSchema.extend({ media_type: z.literal('movie') }),
  tvItemSchema.extend({ media_type: z.literal('tv') }),
  personItemSchema.extend({ media_type: z.literal('person') }),
]);
export type TmdbMultiItem = z.output<typeof multiItemSchema>;

export function paginatedSchema<S extends z.ZodType>(item: S) {
  return z.object({
    page: z.number(),
    total_pages: z.number(),
    total_results: z.number(),
    results: lenientArray(item),
  });
}

const genreSchema = z.object({ id: z.number(), name: text });

const videoSchema = z.object({
  key: z.string(),
  name: text,
  site: z.string(),
  type: z.string(),
  official: z.boolean().nullish(),
  iso_639_1: optionalText,
  published_at: optionalText,
});
export type TmdbVideo = z.output<typeof videoSchema>;

const providerSchema = z.object({
  provider_id: z.number(),
  provider_name: text,
  logo_path: optionalText,
  display_priority: z.number().nullish(),
});

const countryProvidersSchema = z.object({
  link: optionalText,
  flatrate: lenientArray(providerSchema).optional(),
  free: lenientArray(providerSchema).optional(),
  ads: lenientArray(providerSchema).optional(),
  rent: lenientArray(providerSchema).optional(),
  buy: lenientArray(providerSchema).optional(),
});
export type TmdbCountryProviders = z.output<typeof countryProvidersSchema>;

const watchProvidersSchema = z.object({
  results: z.record(z.string(), countryProvidersSchema),
});

const castSchema = z.object({
  id: z.number(),
  name: text,
  character: optionalText,
  profile_path: optionalText,
  order: z.number().nullish(),
});

const crewSchema = z.object({
  id: z.number(),
  name: text,
  job: z.string(),
  profile_path: optionalText,
});
export type TmdbCrew = z.output<typeof crewSchema>;

const externalIdsSchema = z.object({ imdb_id: optionalText });

const titleListSchema = <S extends z.ZodType>(item: S) =>
  z.object({ results: lenientArray(item) }).optional();

export const movieDetailSchema = z.object({
  id: z.number(),
  title: text,
  original_title: optionalText,
  overview: optionalText,
  tagline: optionalText,
  poster_path: optionalText,
  backdrop_path: optionalText,
  release_date: optionalText,
  runtime: z.number().nullish(),
  genres: lenientArray(genreSchema),
  vote_average: count,
  vote_count: count,
  imdb_id: optionalText,
  belongs_to_collection: z.object({ id: z.number(), name: text }).nullish(),
  videos: titleListSchema(videoSchema),
  credits: z.object({ cast: lenientArray(castSchema), crew: lenientArray(crewSchema) }).optional(),
  recommendations: titleListSchema(movieItemSchema),
  similar: titleListSchema(movieItemSchema),
  external_ids: externalIdsSchema.optional(),
  'watch/providers': watchProvidersSchema.optional(),
  release_dates: titleListSchema(
    z.object({
      iso_3166_1: z.string(),
      release_dates: lenientArray(z.object({ certification: optionalText })),
    }),
  ),
});
export type TmdbMovieDetail = z.output<typeof movieDetailSchema>;

export const tvDetailSchema = z.object({
  id: z.number(),
  name: text,
  original_name: optionalText,
  overview: optionalText,
  tagline: optionalText,
  poster_path: optionalText,
  backdrop_path: optionalText,
  first_air_date: optionalText,
  last_air_date: optionalText,
  status: optionalText,
  in_production: z.boolean().nullish(),
  number_of_seasons: count,
  number_of_episodes: count,
  episode_run_time: z.array(z.number()).nullish(),
  genres: lenientArray(genreSchema),
  vote_average: count,
  vote_count: count,
  created_by: lenientArray(z.object({ id: z.number(), name: text })).optional(),
  networks: lenientArray(
    z.object({ id: z.number(), name: text, logo_path: optionalText }),
  ).optional(),
  seasons: lenientArray(
    z.object({
      season_number: z.number(),
      name: text,
      episode_count: count,
      air_date: optionalText,
      poster_path: optionalText,
    }),
  ).optional(),
  last_episode_to_air: z.object({ runtime: z.number().nullish() }).nullish(),
  next_episode_to_air: z
    .object({
      season_number: z.number(),
      episode_number: z.number(),
      name: text,
      air_date: optionalText,
    })
    .nullish(),
  videos: titleListSchema(videoSchema),
  aggregate_credits: z
    .object({
      cast: lenientArray(
        z.object({
          id: z.number(),
          name: text,
          profile_path: optionalText,
          total_episode_count: count,
          order: z.number().nullish(),
          roles: lenientArray(z.object({ character: optionalText, episode_count: count })),
        }),
      ),
    })
    .optional(),
  recommendations: titleListSchema(tvItemSchema),
  similar: titleListSchema(tvItemSchema),
  external_ids: externalIdsSchema.optional(),
  'watch/providers': watchProvidersSchema.optional(),
  content_ratings: titleListSchema(z.object({ iso_3166_1: z.string(), rating: optionalText })),
});
export type TmdbTvDetail = z.output<typeof tvDetailSchema>;

export const seasonDetailSchema = z.object({
  season_number: z.number(),
  name: text,
  overview: optionalText,
  air_date: optionalText,
  poster_path: optionalText,
  episodes: lenientArray(
    z.object({
      episode_number: z.number(),
      name: text,
      overview: optionalText,
      air_date: optionalText,
      runtime: z.number().nullish(),
      still_path: optionalText,
      vote_average: count,
      vote_count: count,
    }),
  ),
});
export type TmdbSeasonDetail = z.output<typeof seasonDetailSchema>;

const creditFields = {
  character: optionalText,
  job: optionalText,
  popularity: count,
};

export const personDetailSchema = z.object({
  id: z.number(),
  name: text,
  biography: optionalText,
  birthday: optionalText,
  deathday: optionalText,
  place_of_birth: optionalText,
  profile_path: optionalText,
  known_for_department: optionalText,
  imdb_id: optionalText,
  combined_credits: z
    .object({
      cast: lenientArray(
        z.discriminatedUnion('media_type', [
          movieItemSchema.extend({ media_type: z.literal('movie'), ...creditFields }),
          tvItemSchema.extend({ media_type: z.literal('tv'), ...creditFields }),
        ]),
      ),
      crew: lenientArray(
        z.discriminatedUnion('media_type', [
          movieItemSchema.extend({ media_type: z.literal('movie'), ...creditFields }),
          tvItemSchema.extend({ media_type: z.literal('tv'), ...creditFields }),
        ]),
      ),
    })
    .optional(),
});
export type TmdbPersonDetail = z.output<typeof personDetailSchema>;

/** Türkçe açıklama boşsa İngilizcesini almak için küçük istek */
export const overviewOnlySchema = z.object({ overview: optionalText });
export const biographyOnlySchema = z.object({ biography: optionalText });
