import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { TitleDetail, TitleType } from '../../lib/content';

const HOUR = 60 * 60 * 1000;
const ENDPOINTS: Record<TitleType, string> = { movie: 'movies', tv: 'tv' };

export function useTitle(type: TitleType | undefined, id: string | undefined) {
  return useQuery({
    queryKey: ['title', type, id],
    queryFn: () =>
      apiFetch<TitleDetail>(`/${ENDPOINTS[type ?? 'movie']}/${encodeURIComponent(id ?? '')}`),
    enabled: type !== undefined && id !== undefined,
    staleTime: HOUR,
  });
}
