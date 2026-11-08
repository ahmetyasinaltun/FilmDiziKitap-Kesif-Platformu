import { describe, expect, it } from 'vitest';
import {
  cleanDescription,
  cleanTitle,
  coverUrl,
  dedupeBooks,
  normalizeForMatch,
  toBookDetail,
  toBookSummary,
} from './mappers.js';
import { searchDocSchema, workSchema } from './schemas.js';

const doc = (overrides: Record<string, unknown> = {}) =>
  searchDocSchema.parse({
    key: '/works/OL1168083W',
    title: 'Nineteen Eighty-Four',
    author_name: ['George Orwell'],
    author_key: ['OL15318546A'],
    first_publish_year: 1949,
    cover_i: 111,
    edition_count: 727,
    number_of_pages_median: 318,
    ratings_average: 4.2,
    ratings_count: 900,
    editions: {
      docs: [
        {
          key: '/books/OL46545044M',
          title: '1984',
          language: ['tur'],
          cover_i: 222,
          publisher: ['Can Yayınları'],
          isbn: ['9750718534', '9789750718533'],
          number_of_pages: 352,
        },
      ],
    },
    ...overrides,
  });

describe('cleanTitle', () => {
  it('katalog eklerini temizler', () => {
    expect(cleanTitle('Aylak adam, roman.')).toBe('Aylak adam');
    expect(cleanTitle('Huzur.')).toBe('Huzur');
    expect(cleanTitle('Atomic Habits : How to Build Good Habits')).toBe('Atomic Habits');
    expect(cleanTitle('Bir Ömür Nasıl Yaşanır?')).toBe('Bir Ömür Nasıl Yaşanır?');
  });
});

describe('normalizeForMatch', () => {
  it('aksan ve büyük/küçük harf farkını yok sayar', () => {
    expect(normalizeForMatch('Uçurtma Avcısı')).toBe(normalizeForMatch('Ucurtma Avcisi'));
    expect(normalizeForMatch('İnce Memed')).toBe('ince memed');
  });
});

describe('toBookSummary', () => {
  it('Türkçe baskının adını ve kapağını kullanır, özgün adı ayrıca tutar', () => {
    const book = toBookSummary(doc());
    expect(book).toMatchObject({
      type: 'book',
      id: 'OL1168083W',
      title: '1984',
      originalTitle: 'Nineteen Eighty-Four',
      year: 1949,
      poster: 'https://covers.openlibrary.org/b/id/222-M.jpg',
      rating: 8.4,
      authorNames: ['George Orwell'],
    });
  });

  it('başka dildeki baskıyı yok sayar', () => {
    const book = toBookSummary(
      doc({
        editions: { docs: [{ key: '/books/X', title: 'Quem Pensa Enriquece', language: ['por'] }] },
      }),
    );
    expect(book.title).toBe('Nineteen Eighty-Four');
    expect(book.originalTitle).toBeNull();
  });

  it('az oylu puanı göstermez', () => {
    expect(toBookSummary(doc({ ratings_count: 3 })).rating).toBeNull();
  });
});

describe('dedupeBooks', () => {
  it('aynı başlık ve yazarın tekrarını atar (aksan farkı olsa da)', () => {
    const books = [
      toBookSummary(doc({ key: '/works/OL1W', title: 'Suç ve Ceza', editions: null })),
      toBookSummary(doc({ key: '/works/OL2W', title: 'Suc ve Ceza', editions: null })),
    ];
    expect(dedupeBooks(books).map((book) => book.id)).toEqual(['OL1W']);
  });
});

describe('cleanDescription', () => {
  it('girintili dipnotları, Windows satır sonlarını ve kaynak notunu temizler', () => {
    const raw =
      'Emily Jane Brontë was an English novelist. She published as Ellis Bell. ([Source][2].)\r\n\r\n\r\n' +
      '  [1]: http://upstream.openlibrary.org/works/OL10427528W/Wuthering_Heights\r\n' +
      '  [2]: http://en.wikipedia.org/wiki/Emily_Bronte';

    expect(cleanDescription(raw)).toBe(
      'Emily Jane Brontë was an English novelist. She published as Ellis Bell.',
    );
  });

  it('wiki eklerini ve bağlantıları temizler', () => {
    const raw =
      'A [dystopian](https://en.wikipedia.org/wiki/Dystopia) novel ([source][1])\n\n----------\nSee also: X\n[1]: https://example.com';
    expect(cleanDescription(raw)).toBe('A dystopian novel');
  });

  it('boşsa null döner', () => {
    expect(cleanDescription('  ')).toBeNull();
    expect(cleanDescription(null)).toBeNull();
  });
});

describe('toBookDetail', () => {
  it('Türkçe baskının yayınevini, sayfa sayısını ve ISBN-13’ünü alır', () => {
    const detail = toBookDetail(
      doc(),
      workSchema.parse({ key: '/works/OL1168083W', description: { value: 'Açıklama' } }),
    );
    expect(detail).toMatchObject({
      publisher: 'Can Yayınları',
      pageCount: 352,
      isbn: '9789750718533',
      authors: [{ id: 'OL15318546A', name: 'George Orwell' }],
      openLibraryDescription: 'Açıklama',
      links: { openLibrary: 'https://openlibrary.org/works/OL1168083W' },
    });
  });
});

describe('coverUrl', () => {
  it('geçersiz kapak kimliğinde null', () => {
    expect(coverUrl(-1)).toBeNull();
    expect(coverUrl(null)).toBeNull();
  });
});

describe('dedupeBooks (yazarsız kayıt)', () => {
  it('yazarı boş kopyayı da atar', () => {
    const books = [
      toBookSummary(doc({ key: '/works/OL1W', title: 'Kürk Mantolu Madonna', editions: null })),
      toBookSummary(
        doc({ key: '/works/OL2W', title: 'Kürk Mantolu Madonna', author_name: [], editions: null }),
      ),
      toBookSummary(
        doc({
          key: '/works/OL3W',
          title: 'Kürk Mantolu Madonna',
          author_name: ['Başka Yazar'],
          editions: null,
        }),
      ),
    ];
    expect(dedupeBooks(books).map((book) => book.id)).toEqual(['OL1W', 'OL3W']);
  });
});
