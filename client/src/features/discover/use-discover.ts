import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { Paginated, TitleSummary } from '../../lib/content';

const STALE = 30 * 60 * 1000;

export function useTrending() {
  return useQuery({
    queryKey: ['discover', 'trending'],
    queryFn: () => apiFetch<TitleSummary[]>('/discover/trending?type=all&window=week'),
    staleTime: STALE,
  });
}

function usePaginatedList(name: string) {
  return useQuery({
    queryKey: ['discover', name],
    queryFn: () => apiFetch<Paginated<TitleSummary>>(`/discover/${name}`),
    select: (page) => page.results,
    staleTime: STALE,
  });
}

export const useNowPlaying = () => usePaginatedList('now-playing');
export const usePopularTv = () => usePaginatedList('popular-tv');
