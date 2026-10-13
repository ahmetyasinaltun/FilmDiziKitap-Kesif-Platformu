import type { CombinedSearch, Paginated, SearchSection } from '../domain/content.js';
import { ProviderError } from '../lib/http.js';
import { searchBooks } from '../providers/openlibrary/index.js';
import { searchTmdb } from '../providers/tmdb/index.js';

function toSection<T>(result: PromiseSettledResult<Paginated<T>>): SearchSection<T> {
  if (result.status === 'fulfilled') return { status: 'ok', data: result.value };
  if (result.reason instanceof ProviderError) {
    return {
      status: 'unavailable',
      message: `${result.reason.provider} şu an yanıt vermiyor. Biraz sonra tekrar dene.`,
    };
  }
  throw result.reason;
}

/**
 * "Tümü" araması: film/dizi/kişi (TMDB) ve kitaplar (Open Library) paralel aranır.
 * Biri çökerse diğerinin sonuçları yine gösterilir.
 */
export async function searchAll(query: string, page: number): Promise<CombinedSearch> {
  const [titles, books] = await Promise.allSettled([
    searchTmdb('multi', query, page),
    searchBooks(query, page),
  ]);
  return { titles: toSection(titles), books: toSection(books) };
}

export function isPartial(result: CombinedSearch): boolean {
  return result.titles.status !== 'ok' || result.books.status !== 'ok';
}
