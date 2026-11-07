import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { BookDetail, ContentSummary } from '../../lib/content';

const HOUR = 60 * 60 * 1000;

export function useTurkishLiterature() {
  return useQuery({
    queryKey: ['discover', 'books', 'turkish-literature'],
    queryFn: () => apiFetch<ContentSummary[]>('/discover/books/turkish-literature'),
    staleTime: HOUR,
  });
}

export function useTrendingBooks() {
  return useQuery({
    queryKey: ['discover', 'books', 'trending'],
    queryFn: () => apiFetch<ContentSummary[]>('/discover/books/trending'),
    staleTime: HOUR,
  });
}

export function useBook(id: string | undefined) {
  return useQuery({
    queryKey: ['book', id],
    queryFn: () => apiFetch<BookDetail>(`/books/${encodeURIComponent(id ?? '')}`),
    enabled: id !== undefined,
    staleTime: HOUR,
  });
}
