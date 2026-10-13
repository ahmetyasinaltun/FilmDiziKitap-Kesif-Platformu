import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';

interface Health {
  status: 'ok';
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<Health>('/health'),
  });
}
