import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MovieDetail } from '../domain/content.js';
import { ProviderError } from '../lib/http.js';
import type * as WikipediaModule from '../providers/wikipedia/index.js';

// Dış kaynaklar taklit edilir: testler internete ve veritabanına bağlı değil.
vi.mock('../providers/tmdb/index.js', () => ({
  getMovie: vi.fn(),
  getTv: vi.fn(),
  getSeason: vi.fn(),
  getPerson: vi.fn(),
  searchTmdb: vi.fn(),
  getTrending: vi.fn(),
  getNowPlaying: vi.fn(),
  getPopularTv: vi.fn(),
}));
vi.mock('../providers/omdb/index.js', () => ({ getExternalRatings: vi.fn() }));
vi.mock('../providers/openlibrary/index.js', () => ({
  getBookCore: vi.fn(),
  searchBooks: vi.fn(),
  getTrendingBooks: vi.fn(),
  getTurkishLiterature: vi.fn(),
  getAuthor: vi.fn(),
}));
vi.mock('../providers/googlebooks/index.js', () => ({ findTurkishVolume: vi.fn() }));
// Sadece ağa çıkan fonksiyon taklit edilir; saf yardımcılar (baseTitle) gerçek haliyle kalır.
vi.mock('../providers/wikipedia/index.js', async (importOriginal) => ({
  ...(await importOriginal<typeof WikipediaModule>()),
  findBookArticle: vi.fn(),
}));

const tmdb = await import('../providers/tmdb/index.js');
const omdb = await import('../providers/omdb/index.js');
const openLibrary = await import('../providers/openlibrary/index.js');
const googleBooks = await import('../providers/googlebooks/index.js');
const wikipedia = await import('../providers/wikipedia/index.js');
const { createApp } = await import('../app.js');

const movie: MovieDetail = {
  type: 'movie',
  id: '27205',
  title: 'Başlangıç',
  originalTitle: 'Inception',
  year: 2010,
  poster: null,
  overview: null,
  rating: 8.4,
  tagline: null,
  backdrop: null,
  genres: [],
  voteCount: 1,
  imdbId: 'tt1375666',
  certification: null,
  trailer: null,
  cast: [],
  recommendations: [],
  watchProviders: null,
  externalRatings: null,
  releaseDate: null,
  runtime: null,
  directors: [],
  writers: [],
  collection: null,
};

const app = createApp();

beforeEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/movies/:id', () => {
  it('detayı dış puanlarla döner ve CDN önbellek başlığı ekler', async () => {
    vi.mocked(tmdb.getMovie).mockResolvedValue(movie);
    vi.mocked(omdb.getExternalRatings).mockResolvedValue({
      imdb: { rating: 8.8, votes: 100 },
      rottenTomatoes: 86,
      metacritic: 74,
    });

    const res = await request(app).get('/api/movies/27205');

    expect(res.status).toBe(200);
    expect(res.body.externalRatings.rottenTomatoes).toBe(86);
    expect(res.headers['cache-control']).toContain('s-maxage=');
    expect(tmdb.getMovie).toHaveBeenCalledWith(27205);
  });

  it('OMDb çökerse sayfa yine açılır, sadece dış puanlar boş kalır', async () => {
    vi.mocked(tmdb.getMovie).mockResolvedValue(movie);
    vi.mocked(omdb.getExternalRatings).mockRejectedValue(
      new ProviderError('OMDb', 'unavailable', { status: 401 }),
    );

    const res = await request(app).get('/api/movies/27205');

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Başlangıç');
    expect(res.body.externalRatings).toBeNull();
  });

  it('TMDB "bulunamadı" derse Türkçe 404 döner', async () => {
    vi.mocked(tmdb.getMovie).mockRejectedValue(new ProviderError('TMDB', 'not_found'));

    const res = await request(app).get('/api/movies/999999');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CONTENT_NOT_FOUND');
  });

  it('TMDB erişilemezse 503 döner ve hata yanıtı önbelleğe alınmaz', async () => {
    vi.mocked(tmdb.getMovie).mockRejectedValue(new ProviderError('TMDB', 'unavailable'));

    const res = await request(app).get('/api/movies/27205');

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('PROVIDER_UNAVAILABLE');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('sayı olmayan kimliği reddeder', async () => {
    const res = await request(app).get('/api/movies/abc');
    expect(res.status).toBe(400);
    expect(tmdb.getMovie).not.toHaveBeenCalled();
  });
});

const emptyPage = { page: 1, totalPages: 0, totalResults: 0, results: [] };

describe('GET /api/search', () => {
  it('type=titles sadece TMDB karışık aramasını yapar, kitapları beklemez', async () => {
    vi.mocked(tmdb.searchTmdb).mockResolvedValue(emptyPage);

    const res = await request(app).get('/api/search?q=kar&type=titles');

    expect(res.status).toBe(200);
    expect(tmdb.searchTmdb).toHaveBeenCalledWith('multi', 'kar', 1);
    expect(openLibrary.searchBooks).not.toHaveBeenCalled();
  });

  it('boş aramayı Türkçe mesajla reddeder', async () => {
    const res = await request(app).get('/api/search?q=%20');
    expect(res.status).toBe(400);
    expect(res.body.error.fields.q).toEqual(['Aramak için bir şey yaz.']);
  });

  it('özel karakterli aramayı olduğu gibi iletir', async () => {
    vi.mocked(tmdb.searchTmdb).mockResolvedValue(emptyPage);
    vi.mocked(openLibrary.searchBooks).mockResolvedValue(emptyPage);

    await request(app).get(`/api/search?q=${encodeURIComponent('Tom & Jerry #2')}&page=2`);

    expect(tmdb.searchTmdb).toHaveBeenCalledWith('multi', 'Tom & Jerry #2', 2);
    expect(openLibrary.searchBooks).toHaveBeenCalledWith('Tom & Jerry #2', 2);
  });

  it('kitap kaynağı çökerse film sonuçları yine gelir, eksik yanıt önbelleğe alınmaz', async () => {
    vi.mocked(tmdb.searchTmdb).mockResolvedValue(emptyPage);
    vi.mocked(openLibrary.searchBooks).mockRejectedValue(
      new ProviderError('Open Library', 'unavailable'),
    );

    const res = await request(app).get('/api/search?q=kar');

    expect(res.status).toBe(200);
    expect(res.body.titles.status).toBe('ok');
    expect(res.body.books).toMatchObject({ status: 'unavailable' });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('type=book sadece kitapları arar', async () => {
    vi.mocked(openLibrary.searchBooks).mockResolvedValue(emptyPage);

    const res = await request(app).get('/api/search?q=kar&type=book');

    expect(res.status).toBe(200);
    expect(tmdb.searchTmdb).not.toHaveBeenCalled();
  });
});

describe('GET /api/books/:id', () => {
  const core = {
    type: 'book' as const,
    id: 'OL1W',
    title: 'Ucurtma Avcisi',
    originalTitle: 'The Kite Runner',
    year: 2003,
    poster: null,
    overview: null,
    rating: null,
    authorNames: ['Khaled Hosseini'],
    authors: [{ id: 'OL2A', name: 'Khaled Hosseini' }],
    openLibraryDescription: 'An English description.',
    pageCount: 375,
    publisher: 'Everest',
    isbn: null,
    editionCount: 80,
    links: { openLibrary: 'https://openlibrary.org/works/OL1W', googleBooks: null },
  };

  it('Vikipedi yoksa Türkçe açıklamayı ve doğru yazılışı Google Books’tan alır', async () => {
    vi.mocked(openLibrary.getBookCore).mockResolvedValue(core);
    vi.mocked(wikipedia.findBookArticle).mockResolvedValue({ article: null });
    vi.mocked(googleBooks.findTurkishVolume).mockResolvedValue({
      volume: { title: 'Uçurtma Avcısı', description: 'Türkçe açıklama', previewLink: 'https://g' },
    });

    const res = await request(app).get('/api/books/OL1W');

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Uçurtma Avcısı');
    expect(res.body.description).toEqual({
      text: 'Türkçe açıklama',
      source: 'Google Books',
      url: 'https://g',
    });
    expect(res.body).not.toHaveProperty('openLibraryDescription');
  });

  it('Vikipedi ve Google Books çökerse Open Library açıklamasıyla açılır', async () => {
    vi.mocked(openLibrary.getBookCore).mockResolvedValue(core);
    vi.mocked(wikipedia.findBookArticle).mockRejectedValue(
      new ProviderError('Vikipedi', 'unavailable'),
    );
    vi.mocked(googleBooks.findTurkishVolume).mockRejectedValue(
      new ProviderError('Google Books', 'unavailable', { status: 503 }),
    );

    const res = await request(app).get('/api/books/OL1W');

    expect(res.status).toBe(200);
    expect(res.body.description).toEqual({
      text: 'An English description.',
      source: 'Open Library',
      url: null,
    });
  });

  it('yeterli Vikipedi açıklaması varsa Google Books’a hiç sormaz', async () => {
    vi.mocked(openLibrary.getBookCore).mockResolvedValue(core);
    vi.mocked(wikipedia.findBookArticle).mockResolvedValue({
      article: {
        title: 'Uçurtma Avcısı',
        extract: 'Uzun açıklama. '.repeat(20),
        url: 'https://tr.wikipedia.org/wiki/U',
      },
    });

    const res = await request(app).get('/api/books/OL1W');

    expect(res.body.description.source).toBe('Vikipedi');
    // Aksansız Open Library başlığı, Vikipedi madde adıyla düzelir
    expect(res.body.title).toBe('Uçurtma Avcısı');
    expect(googleBooks.findTurkishVolume).not.toHaveBeenCalled();
  });

  it('geçersiz kitap kimliğini reddeder', async () => {
    const res = await request(app).get('/api/books/27205');
    expect(res.status).toBe(400);
    expect(openLibrary.getBookCore).not.toHaveBeenCalled();
  });
});
