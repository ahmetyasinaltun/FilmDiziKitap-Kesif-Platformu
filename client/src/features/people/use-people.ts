import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { AuthorDetail, PersonDetail } from '../../lib/content';

const HOUR = 60 * 60 * 1000;

export function usePerson(id: string) {
  return useQuery({
    queryKey: ['person', id],
    queryFn: () => apiFetch<PersonDetail>(`/people/${encodeURIComponent(id)}`),
    staleTime: HOUR,
  });
}

export function useAuthor(id: string) {
  return useQuery({
    queryKey: ['author', id],
    queryFn: () => apiFetch<AuthorDetail>(`/authors/${encodeURIComponent(id)}`),
    staleTime: HOUR,
  });
}
