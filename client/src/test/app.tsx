import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { vi } from 'vitest';
import type { SessionUser } from '../lib/content';

export const testUser: SessionUser = {
  id: 'u1',
  username: 'deneme',
  email: 'deneme@example.com',
  displayName: null,
  avatarUrl: null,
  emailVerified: true,
};

interface Reply {
  status?: number;
  body?: unknown;
}

interface ApiCall {
  method: string;
  /** `/api` öneki olmadan, sorgu dahil: `/search?q=nolan&type=titles&page=1` */
  path: string;
  body: unknown;
}

type Handler = Reply | ((call: ApiCall & { query: URLSearchParams }) => Reply | Promise<Reply>);

/**
 * Sunucuyu ağ sınırında taklit eder: `fetch` değişir, `apiFetch`, TanStack Query ve hook'lar
 * gerçek haliyle çalışır. Anahtar "YÖNTEM /yol" biçimindedir; sorgu kısmı anahtara yazılmaz,
 * gerekirse işleyici `query` ile bakar. Taklit edilmemiş istek 500 döner ve `calls`'ta görünür.
 * Oturum varsayılan olarak yoktur (`GET /auth/me` → ziyaretçi).
 */
export function mockApi(routes: Record<string, Handler>) {
  const calls: ApiCall[] = [];
  const handlers: Record<string, Handler> = { 'GET /auth/me': { body: { user: null } }, ...routes };

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), 'http://localhost');
      const method = init?.method ?? 'GET';
      const pathname = url.pathname.replace(/^\/api/, '');
      const call = {
        method,
        path: pathname + url.search,
        body: typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined,
      };
      calls.push(call);

      const handler = handlers[`${method} ${pathname}`];
      const reply: Reply = !handler
        ? {
            status: 500,
            body: {
              error: { code: 'NOT_MOCKED', message: `Taklit edilmedi: ${method} ${pathname}` },
            },
          }
        : typeof handler === 'function'
          ? await handler({ ...call, query: url.searchParams })
          : handler;

      const status = reply.status ?? 200;
      return new Response(status === 204 ? null : JSON.stringify(reply.body ?? null), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );

  return { calls };
}

const plain = (value: string | null | undefined) => (value ?? '').replaceAll('­', '');

/**
 * Erişilebilir ad eşleştirici (rol sorgularında `name`). Kart adlarında heceleme için görünmez
 * tire (U+00AD) var ("Yıl­dız­la­ra­ra­sı"); karşılaştırma onsuz yapılır.
 */
export function nameOf(expected: string) {
  return (name: string) => plain(name) === expected;
}

/** Sunucu hata yanıtı biçimi (`{ error: { code, message, fields? } }`) */
export function apiError(
  status: number,
  message: string,
  fields?: Record<string, string[]>,
): Reply {
  return { status, body: { error: { code: 'TEST_ERROR', message, fields } } };
}

/** Uygulamayı verilen adreste, testlere özel bir önbellek ve bellek içi yönlendiriciyle açar. */
export function renderApp(routes: RouteObject[], url: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  const view = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...view, router, client };
}
