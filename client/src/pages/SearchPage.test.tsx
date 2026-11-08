import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ContentSummary } from '../lib/content';
import { apiError, mockApi, nameOf, renderApp } from '../test/app';
import { SearchPage } from './SearchPage';

const routes = [{ path: '/arama', element: <SearchPage /> }];

const interstellar: ContentSummary = {
  type: 'movie',
  id: '157336',
  title: 'Yıldızlararası',
  originalTitle: 'Interstellar',
  year: 2014,
  poster: null,
  overview: null,
  rating: 8.5,
};

const page = (results: unknown[]) => ({
  page: 1,
  totalPages: 1,
  totalResults: results.length,
  results,
});

describe('arama', () => {
  it('yazılanı kısa bir beklemeden sonra adrese yazar ve sonuçları gösterir', async () => {
    const api = mockApi({
      'GET /discover/trending': { body: [] },
      'GET /search': ({ query }) => ({
        body: page(query.get('type') === 'titles' ? [interstellar] : []),
      }),
    });
    const { router } = renderApp(routes, '/arama');

    await userEvent.setup().type(screen.getByRole('searchbox'), 'nolan');

    const section = await screen.findByRole('region', { name: 'Film ve diziler' });
    expect(
      within(section).getByRole('heading', { name: nameOf('Yıldızlararası') }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toBe('?q=nolan');
    // Her harfte değil, yazma bitince tek arama: "no", "nol"... için istek gitmez.
    const searched = api.calls
      .filter((call) => call.path.startsWith('/search'))
      .map((call) => new URLSearchParams(call.path.split('?')[1]).get('q'));
    expect(new Set(searched)).toEqual(new Set(['nolan']));
  });

  it('sonuç yoksa bunu söyler', async () => {
    mockApi({ 'GET /search': { body: page([]) } });
    renderApp(routes, '/arama?q=zzxyq');

    expect(await screen.findByText('“zzxyq” için sonuç bulunamadı.')).toBeInTheDocument();
  });

  it('film araması düşerse hatayı gösterir, tekrar denenince sonuçlar gelir', async () => {
    let titlesUp = false;
    mockApi({
      'GET /search': ({ query }) =>
        query.get('type') === 'titles'
          ? titlesUp
            ? { body: page([interstellar]) }
            : apiError(503, 'Film ve dizi araması şu an yapılamıyor.')
          : { body: page([]) },
    });
    renderApp(routes, '/arama?q=nolan');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Film ve dizi araması şu an yapılamıyor.');

    titlesUp = true;
    await userEvent.setup().click(within(alert).getByRole('button', { name: 'Tekrar dene' }));

    expect(
      await screen.findByRole('heading', { name: nameOf('Yıldızlararası') }),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
