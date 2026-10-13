import { describe, expect, it } from 'vitest';
import {
  mapWatchProviders,
  pickTrailer,
  ratingOf,
  toMovieDetail,
  toPersonDetail,
  toTvDetail,
  yearOf,
} from './mappers.js';
import { movieDetailSchema, personDetailSchema, tvDetailSchema } from './schemas.js';

const video = (overrides: Record<string, unknown>) => ({
  key: 'k',
  name: 'Video',
  site: 'YouTube',
  type: 'Trailer',
  official: true,
  iso_639_1: 'en',
  published_at: '2020-01-01T00:00:00Z',
  ...overrides,
});

describe('küçük yardımcılar', () => {
  it('yearOf boş ve geçersiz tarihte null döner', () => {
    expect(yearOf('2010-07-16')).toBe(2010);
    expect(yearOf(null)).toBeNull();
    expect(yearOf('bilinmiyor')).toBeNull();
  });

  it('ratingOf oy yoksa null, varsa tek ondalık', () => {
    expect(ratingOf(8.373, 40412)).toBe(8.4);
    expect(ratingOf(0, 0)).toBeNull();
  });
});

describe('pickTrailer', () => {
  it('Türkçe fragmanı İngilizceye tercih eder', () => {
    const trailer = pickTrailer([
      video({ key: 'en', iso_639_1: 'en' }),
      video({ key: 'tr', iso_639_1: 'tr' }),
    ]);
    expect(trailer?.key).toBe('tr');
  });

  it('klip ve YouTube dışı videoları atlar, teaser yedek olur', () => {
    const trailer = pickTrailer([
      video({ key: 'clip', type: 'Clip' }),
      video({ key: 'vimeo', site: 'Vimeo' }),
      video({ key: 'teaser', type: 'Teaser' }),
    ]);
    expect(trailer?.key).toBe('teaser');
  });

  it('aynı dilde resmi ve yeni olanı seçer', () => {
    const trailer = pickTrailer([
      video({ key: 'fan', official: false, published_at: '2024-01-01' }),
      video({ key: 'old', published_at: '2010-01-01' }),
      video({ key: 'new', published_at: '2022-01-01' }),
    ]);
    expect(trailer?.key).toBe('new');
  });

  it('uygun video yoksa null', () => {
    expect(pickTrailer([video({ type: 'Featurette' })])).toBeNull();
  });
});

describe('mapWatchProviders', () => {
  const provider = (id: number, priority = 1) => ({
    provider_id: id,
    provider_name: `P${id}`,
    logo_path: `/p${id}.png`,
    display_priority: priority,
  });

  it("sadece Türkiye'yi alır, ücretsiz ve reklamlıyı birleştirir", () => {
    const result = mapWatchProviders({
      US: { link: 'us', flatrate: [provider(1)] },
      TR: {
        link: 'tr',
        flatrate: [provider(8)],
        free: [provider(5)],
        ads: [provider(5), provider(6)],
      },
    });
    expect(result?.link).toBe('tr');
    expect(result?.stream.map((p) => p.id)).toEqual([8]);
    expect(result?.free.map((p) => p.id)).toEqual([5, 6]);
  });

  it("Türkiye'de yoksa veya liste boşsa null", () => {
    expect(mapWatchProviders({ US: { link: 'us', flatrate: [provider(1)] } })).toBeNull();
    expect(mapWatchProviders({ TR: { link: 'tr' } })).toBeNull();
    expect(mapWatchProviders(undefined)).toBeNull();
  });
});

describe('toMovieDetail', () => {
  const raw = movieDetailSchema.parse({
    id: 27205,
    title: 'Başlangıç',
    original_title: 'Inception',
    overview: '',
    tagline: '',
    poster_path: '/poster.jpg',
    backdrop_path: null,
    release_date: '2010-07-15',
    runtime: 148,
    genres: [{ id: 28, name: 'Aksiyon' }],
    vote_average: 8.373,
    vote_count: 40412,
    imdb_id: 'tt1375666',
    credits: {
      cast: [
        { id: 2, name: 'İkinci', character: 'B', profile_path: null, order: 1 },
        { id: 1, name: 'Birinci', character: 'A', profile_path: null, order: 0 },
      ],
      crew: [
        { id: 525, name: 'Christopher Nolan', job: 'Director' },
        { id: 525, name: 'Christopher Nolan', job: 'Writer' },
        { id: 525, name: 'Christopher Nolan', job: 'Screenplay' },
        { id: 9, name: 'Kurgucu', job: 'Editor' },
      ],
    },
    recommendations: { results: [] },
    similar: { results: [{ id: 157336, title: 'Yıldızlararası', release_date: '2014-11-05' }] },
    release_dates: {
      results: [
        { iso_3166_1: 'US', release_dates: [{ certification: 'PG-13' }] },
        { iso_3166_1: 'TR', release_dates: [{ certification: '' }, { certification: '13+' }] },
      ],
    },
  });
  const movie = toMovieDetail(raw);

  it('boş metinleri null yapar, farklıysa orijinal adı tutar', () => {
    expect(movie.overview).toBeNull();
    expect(movie.tagline).toBeNull();
    expect(movie.originalTitle).toBe('Inception');
    expect(movie.year).toBe(2010);
  });

  it('oyuncuları sıraya göre dizer, ekipten yönetmen ve yazarları ayırır', () => {
    expect(movie.cast.map((c) => c.name)).toEqual(['Birinci', 'İkinci']);
    expect(movie.directors).toEqual([{ id: '525', name: 'Christopher Nolan', job: 'Director' }]);
    expect(movie.writers).toHaveLength(1);
  });

  it('Türkiye yaş sınırını alır, öneri yoksa benzerlere düşer', () => {
    expect(movie.certification).toBe('13+');
    expect(movie.recommendations.map((r) => r.title)).toEqual(['Yıldızlararası']);
  });
});

describe('toTvDetail', () => {
  it('özel bölümleri sona alır, bölüm süresi yoksa son bölümünkini kullanır', () => {
    const tv = toTvDetail(
      tvDetailSchema.parse({
        id: 1399,
        name: 'Game of Thrones',
        genres: [],
        episode_run_time: [],
        last_episode_to_air: { runtime: 80 },
        seasons: [
          { season_number: 0, name: 'Özel Bölümler', episode_count: 3 },
          { season_number: 2, name: '2. sezon', episode_count: 10 },
          { season_number: 1, name: '1. sezon', episode_count: 10 },
        ],
        aggregate_credits: {
          cast: [
            {
              id: 1,
              name: 'Oyuncu',
              total_episode_count: 12,
              roles: [
                { character: 'Küçük rol', episode_count: 2 },
                { character: 'Ana rol', episode_count: 10 },
              ],
            },
          ],
        },
      }),
    );
    expect(tv.seasons.map((s) => s.number)).toEqual([1, 2, 0]);
    expect(tv.episodeRuntime).toBe(80);
    expect(tv.cast[0]).toMatchObject({ character: 'Ana rol', episodeCount: 12 });
  });
});

describe('toPersonDetail', () => {
  it('talk show ve "kendisi" rollerini atar, aynı yapımdaki rolleri birleştirir', () => {
    const person = toPersonDetail(
      personDetailSchema.parse({
        id: 525,
        name: 'Christopher Nolan',
        combined_credits: {
          cast: [
            { media_type: 'tv', id: 1, name: 'Talk Show', genre_ids: [10767], character: 'Guest' },
            { media_type: 'tv', id: 2, name: 'Belgesel Dizi', genre_ids: [99], character: 'Self' },
          ],
          crew: [
            {
              media_type: 'movie',
              id: 27205,
              title: 'Başlangıç',
              release_date: '2010-07-15',
              job: 'Director',
              vote_count: 40000,
            },
            {
              media_type: 'movie',
              id: 27205,
              title: 'Başlangıç',
              release_date: '2010-07-15',
              job: 'Writer',
              vote_count: 40000,
            },
            {
              media_type: 'movie',
              id: 872585,
              title: 'Oppenheimer',
              release_date: '2023-07-19',
              job: 'Director',
              vote_count: 10000,
            },
          ],
        },
      }),
    );
    expect(person.credits.map((c) => c.content.title)).toEqual(['Oppenheimer', 'Başlangıç']);
    expect(person.credits[1]?.roles).toEqual(['Director', 'Writer']);
    expect(person.knownFor[0]?.title).toBe('Başlangıç');
  });
});
