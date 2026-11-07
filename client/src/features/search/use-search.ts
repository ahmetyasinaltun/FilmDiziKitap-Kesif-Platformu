import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { Paginated } from '../../lib/content';

const HOUR = 60 * 60 * 1000;
export const MIN_QUERY_LENGTH = 2;

/** Arama sekmeleri. `param` adresteki değer (`?tur=film`), `type` API'nin istediği değer. */
export const SEARCH_TABS = [
  { id: 'all', label: 'Tümü', param: null, type: 'titles' },
  { id: 'movie', label: 'Film', param: 'film', type: 'movie' },
  { id: 'tv', label: 'Dizi', param: 'dizi', type: 'tv' },
  { id: 'person', label: 'Kişi', param: 'kisi', type: 'person' },
  { id: 'book', label: 'Kitap', param: 'kitap', type: 'book' },
] as const;

export type SearchTab = (typeof SEARCH_TABS)[number];

export function tabFromParam(param: string | null): SearchTab {
  return SEARCH_TABS.find((tab) => tab.param === param) ?? SEARCH_TABS[0];
}

/** Sayfalı arama. Yeni harf yazılırken eski sonuçlar ekranda kalır, sayfa boşalıp dolmaz. */
export function useSearch<T>(type: SearchTab['type'], q: string) {
  return useInfiniteQuery({
    queryKey: ['search', type, q],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ q, type, page: String(pageParam) });
      return apiFetch<Paginated<T>>(`/search?${params}`);
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: q.length >= MIN_QUERY_LENGTH,
    staleTime: HOUR,
    placeholderData: keepPreviousData,
  });
}

/** Sayfalar arasında aynı kayıt tekrar gelebilir; liste anahtarı benzersiz kalsın. */
export function uniqueResults<T extends { type: string; id: string }>(
  pages: { results: T[] }[] | undefined,
): T[] {
  const seen = new Map<string, T>();
  for (const item of pages?.flatMap((page) => page.results) ?? []) {
    seen.set(`${item.type}-${item.id}`, seen.get(`${item.type}-${item.id}`) ?? item);
  }
  return [...seen.values()];
}
