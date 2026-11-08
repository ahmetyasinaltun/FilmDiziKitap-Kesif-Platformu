/**
 * Open Library ham verisini normalize tiplere çeviren saf fonksiyonlar.
 */
import type { AuthorDetail, BookDetail, ContentSummary } from '../../domain/content.js';
import { openLibraryUrl } from './client.js';
import type { OlAuthor, OlEdition, OlSearchDoc, OlWork } from './schemas.js';

/** Bu kadar oydan azsa Open Library puanı gösterilmez (Türkçe kitaplarda genelde 1-9 oy var). */
const MIN_RATING_COUNT = 10;

/** "/works/OL1168083W" → "OL1168083W" */
export function olid(key: string): string {
  return key.slice(key.lastIndexOf('/') + 1);
}

export function coverUrl(coverId: number | null | undefined, size: 'S' | 'M' | 'L' = 'M') {
  return coverId && coverId > 0
    ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
    : null;
}

/**
 * Katalog başlıklarını sadeleştirir: sondaki nokta, ", roman" eki ve " : " sonrası alt başlık.
 * "Aylak adam, roman." → "Aylak adam", "Atomic Habits : How to Build..." → "Atomic Habits"
 */
export function cleanTitle(title: string): string {
  return (title.split(' : ')[0] ?? title)
    .replace(/[,:]\s*roman\.?$/i, '')
    .replace(/\s*\.+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Arama `lang=tr` ile yapıldığında Open Library varsa Türkçe baskıyı seçer, yoksa başka
 * dilde bir baskı döner. Dili Türkçe olan ya da dili hiç girilmemiş (Türk yayınevi
 * kayıtlarında sık) baskı kullanılır; başka dildeki baskı yok sayılır.
 */
export function turkishEdition(doc: OlSearchDoc): OlEdition | null {
  const edition = doc.editions?.docs[0];
  if (!edition) return null;
  const languages = edition.language ?? [];
  return languages.length === 0 || languages.includes('tur') ? edition : null;
}

export function toBookSummary(doc: OlSearchDoc): ContentSummary & { type: 'book' } {
  const edition = turkishEdition(doc);
  const title = cleanTitle(edition?.title ?? doc.title);
  const original = cleanTitle(doc.title);
  return {
    type: 'book',
    id: olid(doc.key),
    title,
    originalTitle: original !== title ? original : null,
    year: doc.first_publish_year ?? null,
    poster: coverUrl(edition?.cover_i ?? doc.cover_i),
    overview: null,
    rating:
      doc.ratings_count >= MIN_RATING_COUNT && doc.ratings_average
        ? Math.round(doc.ratings_average * 2 * 10) / 10
        : null,
    authorNames: doc.author_name ?? [],
  };
}

/** Karşılaştırma için: küçük harf, aksansız, noktalamasız ("Uçurtma Avcısı" = "Ucurtma Avcisi") */
export function normalizeForMatch(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Aynı çevirinin farklı yayınevi baskıları Open Library'de bazen ayrı eser olarak kayıtlı
 * ("Suç ve Ceza" × 3). Aynı başlık aynı yazarla ikinci kez görünürse atlanır. Yazarı
 * girilmemiş kayıt, aynı başlıklı herhangi bir kayıtla aynı kabul edilir.
 */
export function dedupeBooks<T extends ContentSummary>(books: T[]): T[] {
  const authorsByTitle = new Map<string, Set<string>>();
  return books.filter((book) => {
    const title = normalizeForMatch(book.title);
    const author = normalizeForMatch(book.authorNames?.[0] ?? '');
    const authors = authorsByTitle.get(title);
    if (authors && (author === '' || authors.has('') || authors.has(author))) return false;
    authorsByTitle.set(title, (authors ?? new Set<string>()).add(author));
    return true;
  });
}

/**
 * Open Library açıklamalarındaki wiki biçimini temizler: "----------" sonrası ek bölüm,
 * markdown bağlantıları ve kaynak dipnotları. Metinler Windows satır sonu (\r\n) ve girintili
 * dipnot satırları ("  [1]: http://...") içerebiliyor.
 */
export function cleanDescription(value: string | null): string | null {
  if (!value) return null;
  const text = value.replace(/\r\n?/g, '\n');
  const cleaned = (text.split(/\n-{3,}/)[0] ?? text)
    // "([Source][1])", "([source][2].)" ve bağlantısız "(Source.)"
    .replace(/\s*\(\s*\[?source\]?(?:\[\d+\])?\s*\.?\s*\)/gi, '')
    .replace(/^[ \t]*\[\d+\]:.*$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\[\d+\]/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned || null;
}

/** Open Library'den gelen kısım; açıklama, Google Books ile birleştirilirken seçilir (services/books.ts). */
export type BookCore = Omit<BookDetail, 'description'> & { openLibraryDescription: string | null };

export function toBookDetail(doc: OlSearchDoc, work: OlWork): BookCore {
  const edition = turkishEdition(doc);
  const authorKeys = doc.author_key ?? [];
  return {
    ...toBookSummary(doc),
    authors: (doc.author_name ?? []).map((name, index) => ({
      id: authorKeys[index] ?? '',
      name,
    })),
    openLibraryDescription: cleanDescription(work.description),
    pageCount: edition?.number_of_pages ?? doc.number_of_pages_median ?? null,
    publisher: edition?.publisher?.[0] ?? null,
    isbn: edition?.isbn?.find((isbn) => isbn.length === 13) ?? edition?.isbn?.[0] ?? null,
    editionCount: doc.edition_count,
    links: { openLibrary: openLibraryUrl(doc.key), googleBooks: null },
  };
}

export function toAuthorDetail(author: OlAuthor, works: OlSearchDoc[]): AuthorDetail {
  const photo = author.photos?.find((id) => id > 0);
  return {
    type: 'author',
    id: olid(author.key),
    name: author.name ?? '',
    bio: cleanDescription(author.bio),
    birthDate: author.birth_date,
    deathDate: author.death_date,
    photo: photo ? `https://covers.openlibrary.org/a/id/${photo}-M.jpg` : null,
    works: dedupeBooks(works.map(toBookSummary)),
  };
}
