/**
 * Open Library servis katmanı: kitap arama, eser detayı, yazar, trendler. Kitapların
 * kimliği Open Library eser kimliğidir ("OL1168083W"). Karar: LEARNING.md ("Kitap kaynağı").
 */
import type { AuthorDetail, ContentSummary, Paginated } from '../../domain/content.js';
import { cached } from '../../lib/api-cache.js';
import { ProviderError } from '../../lib/http.js';
import { olGet } from './client.js';
import {
  dedupeBooks,
  olid,
  toAuthorDetail,
  toBookDetail,
  toBookSummary,
  turkishEdition,
  type BookCore,
} from './mappers.js';
import {
  authorSchema,
  SEARCH_FIELDS,
  searchResponseSchema,
  trendingSchema,
  workSchema,
} from './schemas.js';

const VERSION = 2;
const key = (...parts: (string | number)[]) => ['ol', `v${VERSION}`, ...parts].join(':');

const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const PAGE_SIZE = 20;

/** `lang=tr`: Open Library her eser için varsa Türkçe baskıyı seçip döndürür. */
function search(params: Record<string, string>) {
  return olGet('/search.json', searchResponseSchema, {
    lang: 'tr',
    fields: SEARCH_FIELDS,
    ...params,
  });
}

/** Birleştirilmiş eserlerde Open Library yönlendirme kaydı döner; bir kez takip edilir. */
async function getWork(id: string) {
  const work = await olGet(`/works/${id}.json`, workSchema);
  if (work.type?.key === '/type/redirect' && work.location) {
    return olGet(`${work.location}.json`, workSchema);
  }
  return work;
}

export function getBookCore(id: string): Promise<BookCore> {
  return cached(key('work', id), { ttl: 7 * DAY }, async () => {
    const work = await getWork(id);
    const result = await search({ q: `key:"${work.key}"`, limit: '1' });
    const doc = result.docs[0];
    if (!doc) throw new ProviderError('Open Library', 'not_found');
    return toBookDetail(doc, work);
  });
}

export function searchBooks(query: string, page: number): Promise<Paginated<ContentSummary>> {
  const normalized = query.trim().toLocaleLowerCase('tr-TR');
  return cached(key('search', normalized, page), { ttl: 6 * HOUR }, async () => {
    const raw = await search({ q: normalized, page: String(page), limit: String(PAGE_SIZE) });
    return {
      page,
      totalPages: Math.ceil(raw.numFound / PAGE_SIZE),
      totalResults: raw.numFound,
      results: dedupeBooks(raw.docs.map(toBookSummary)),
    };
  });
}

/**
 * Haftanın trend kitapları. Open Library'nin trend listesi küresel ve İngilizce başlıklı;
 * eserlerin Türkçe baskıları tek bir toplu aramayla alınır.
 */
export function getTrendingBooks(): Promise<ContentSummary[]> {
  return cached(key('trending', 'weekly'), { ttl: 12 * HOUR }, async () => {
    const trending = await olGet('/trending/weekly.json', trendingSchema, { limit: '20' });
    const keys = trending.works.map((work) => work.key);
    if (keys.length === 0) return [];
    const result = await search({
      q: `key:(${keys.map((workKey) => `"${workKey}"`).join(' OR ')})`,
      limit: String(keys.length),
    });
    // Toplu arama sırayı korumaz; trend sırasına geri dizilir.
    const order = new Map(keys.map((workKey, index) => [workKey, index]));
    return result.docs
      .sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0))
      .map(toBookSummary);
  });
}

/** Türk edebiyatı rafı: okur puanına göre, sadece Türkçe baskısı olan eserler. */
export function getTurkishLiterature(): Promise<ContentSummary[]> {
  return cached(key('turkish-fiction'), { ttl: DAY }, async () => {
    const result = await search({ q: 'subject_key:turkish_fiction', sort: 'rating', limit: '40' });
    return dedupeBooks(result.docs.filter((doc) => turkishEdition(doc)).map(toBookSummary)).slice(
      0,
      PAGE_SIZE,
    );
  });
}

export function getAuthor(id: string): Promise<AuthorDetail> {
  return cached(key('author', id), { ttl: 7 * DAY }, async () => {
    let author = await olGet(`/authors/${id}.json`, authorSchema);
    if (author.type?.key === '/type/redirect' && author.location) {
      author = await olGet(`${author.location}.json`, authorSchema);
    }
    // Open Library'de aynı yazarın birden çok kaydı olabiliyor (Orwell'in bir kaydında 1,
    // adıyla aramada 655 eser). Kimlik ya da adla eşleşen eserler birlikte alınır.
    const byName = author.name ? ` OR author:"${author.name.replaceAll('"', '')}"` : '';
    const works = await search({
      q: `author_key:${olid(author.key)}${byName}`,
      sort: 'editions',
      limit: '30',
    });
    return toAuthorDetail(author, works.docs);
  });
}
