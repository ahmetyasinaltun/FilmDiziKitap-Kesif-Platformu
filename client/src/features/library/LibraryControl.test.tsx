import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { LibraryEntry } from '../../lib/content';
import { apiError, mockApi, renderApp, testUser } from '../../test/app';
import { LibraryControl, LibraryRating } from './LibraryControl';

const ENTRY_PATH = '/library/movie/27205';

function renderControl() {
  return renderApp(
    [
      {
        path: '/film/:id',
        element: (
          <>
            <LibraryControl type="movie" id="27205" />
            <LibraryRating type="movie" id="27205" />
          </>
        ),
      },
    ],
    '/film/27205',
  );
}

const signedIn = { 'GET /auth/me': { body: { user: testUser } } };

const entry = (overrides: Partial<LibraryEntry> = {}): LibraryEntry => ({
  status: 'completed',
  rating: null,
  finishedAt: null,
  updatedAt: '2026-11-08T10:00:00.000Z',
  ...overrides,
});

/** Yanıtı test bitirene kadar bekleten istek: iyimser güncellemeyi görmek için. */
function deferred() {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
}

describe('kütüphane düğmeleri', () => {
  it('ziyaretçiye giriş bağlantısı gösterir, istek göndermez', async () => {
    const api = mockApi({});
    renderControl();

    await userEvent.setup().click(await screen.findByRole('button', { name: 'İzleyeceğim' }));

    const link = await screen.findByRole('link', { name: 'giriş yap' });
    expect(link).toHaveAttribute('href', `/giris?next=${encodeURIComponent('/film/27205')}`);
    expect(api.calls.some((call) => call.path.startsWith('/library'))).toBe(false);
  });

  it('e-postasını doğrulamamış hesaba doğrulama bağlantısı gösterir, kaydetmeye çalışmaz', async () => {
    const api = mockApi({
      'GET /auth/me': { body: { user: { ...testUser, emailVerified: false } } },
      [`GET ${ENTRY_PATH}`]: { body: { entry: null } },
    });
    renderControl();

    await userEvent.setup().click(await screen.findByRole('button', { name: 'İzleyeceğim' }));

    const link = await screen.findByRole('link', { name: 'e-postanı doğrula' });
    expect(link).toHaveAttribute(
      'href',
      `/eposta-dogrula?next=${encodeURIComponent('/film/27205')}`,
    );
    expect(api.calls.some((call) => call.method === 'PUT')).toBe(false);
  });

  it('kaydı sunucuyu beklemeden gösterir', async () => {
    const response = deferred();
    const api = mockApi({
      ...signedIn,
      [`GET ${ENTRY_PATH}`]: { body: { entry: null } },
      [`PUT ${ENTRY_PATH}`]: async () => {
        await response.promise;
        return { body: { entry: entry({ status: 'planned' }) } };
      },
    });
    renderControl();
    await waitFor(() => expect(api.calls.some((call) => call.path === ENTRY_PATH)).toBe(true));

    await userEvent.setup().click(screen.getByRole('button', { name: 'İzleyeceğim' }));

    // Yanıt henüz gelmedi ama düğme seçili.
    expect(screen.getByRole('button', { name: 'İzleyeceğim' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(api.calls.find((call) => call.method === 'PUT')?.body).toEqual({ status: 'planned' });
    response.resolve();
  });

  it('sunucu reddederse eski haline döner ve hatayı söyler', async () => {
    // Hatadan sonraki yeniden çekme yanıtsız kalır: düğmeyi ancak iyimser değerin geri alınması
    // eski haline getirebilir (yeniden çekme hızlı olsaydı eksik bir geri alma gizlenirdi).
    let reads = 0;
    const api = mockApi({
      ...signedIn,
      [`GET ${ENTRY_PATH}`]: () =>
        reads++ === 0 ? { body: { entry: null } } : new Promise<never>(() => {}),
      [`PUT ${ENTRY_PATH}`]: apiError(
        503,
        'Film bilgisi şu an alınamadı, biraz sonra tekrar dene.',
      ),
    });
    renderControl();
    await waitFor(() => expect(api.calls.some((call) => call.path === ENTRY_PATH)).toBe(true));

    await userEvent.setup().click(screen.getByRole('button', { name: 'İzledim' }));

    expect(await screen.findByText(/biraz sonra tekrar dene/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'İzledim' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('izlenen yapıma puan verir, seçili puana tekrar basınca puanı kaldırır', async () => {
    // Sunucu kaydı hatırlar: kayıttan sonra uygulama veriyi yeniden çeker.
    let saved = entry({ rating: 7 });
    const api = mockApi({
      ...signedIn,
      [`GET ${ENTRY_PATH}`]: () => ({ body: { entry: saved } }),
      [`PUT ${ENTRY_PATH}`]: ({ body }) => {
        saved = entry(body as Partial<LibraryEntry>);
        return { body: { entry: saved } };
      },
    });
    renderControl();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('radio', { name: '8' }));
    await waitFor(() => expect(screen.getByRole('radio', { name: '8' })).toBeChecked());

    await user.click(screen.getByRole('radio', { name: '8' }));
    await waitFor(() => expect(screen.getByRole('radio', { name: '8' })).not.toBeChecked());

    const puts = api.calls.filter((call) => call.method === 'PUT').map((call) => call.body);
    expect(puts).toEqual([
      { status: 'completed', rating: 8 },
      { status: 'completed', rating: null },
    ]);
  });
});
