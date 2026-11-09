import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { SessionUser } from '../../lib/content';

const SESSION_KEY = ['session'];
const MINUTE = 60 * 1000;

interface SessionResponse {
  user: SessionUser | null;
}

/** Ziyaretçi hata değildir: site herkese açık, oturum yoksa `user` null olur. */
export function useSession() {
  const query = useQuery({
    queryKey: SESSION_KEY,
    queryFn: () => apiFetch<SessionResponse>('/auth/me'),
    staleTime: 5 * MINUTE,
  });
  return { user: query.data?.user ?? null, isPending: query.isPending };
}

export function useAuthForm(path: 'login' | 'register') {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (body: Record<string, string>) =>
      apiFetch<SessionResponse>(`/auth/${path}`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (data) => {
      client.setQueryData(SESSION_KEY, data);
      void client.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

/**
 * E-postadaki bağlantının kodunu sunucuya gönderir. Bağlantı başka bir cihazda ya da başka bir
 * hesap açıkken de açılabilir: sonuç doğrudan yazılmaz, oturum sunucudan yeniden okunur.
 */
export function useVerifyEmail() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (token: string) =>
      apiFetch<SessionResponse>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
    onSuccess: () => void client.invalidateQueries({ queryKey: SESSION_KEY }),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => apiFetch<null>('/auth/verify-email/resend', { method: 'POST' }),
  });
}

export function useLogout() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<null>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      client.setQueryData<SessionResponse>(SESSION_KEY, { user: null });
      // Başka biri aynı tarayıcıda giriş yaparsa önceki kullanıcının kaydı görünmesin.
      client.removeQueries({ queryKey: ['library'] });
    },
  });
}
