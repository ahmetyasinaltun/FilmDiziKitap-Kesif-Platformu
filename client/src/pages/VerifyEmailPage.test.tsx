import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { apiError, mockApi, renderApp, testUser } from '../test/app';
import { VerifyEmailPage } from './VerifyEmailPage';

const routes = [
  { path: '/eposta-dogrula', element: <VerifyEmailPage /> },
  { path: '/', element: <p>Ana sayfa</p> },
];

const CODE = 'k'.repeat(43);
const unverified = { ...testUser, emailVerified: false };

/** Doğrulama ve oturum durumu tutan taklit: doğrulanınca `/auth/me` da doğrulanmış döner. */
function mockVerification(startUser: typeof testUser | null = unverified) {
  let user = startUser;
  return mockApi({
    'GET /auth/me': () => ({ body: { user } }),
    'POST /auth/verify-email': () => {
      if (user) user = { ...user, emailVerified: true };
      return { body: { user: { ...testUser, emailVerified: true } } };
    },
  });
}

describe('e-postadaki bağlantı', () => {
  it('sayfa açılınca değil, düğmeye basınca doğrular (e-posta tarayıcıları bağlantıyı önceden açar)', async () => {
    const api = mockVerification();
    renderApp(routes, `/eposta-dogrula?kod=${CODE}`);

    const button = await screen.findByRole('button', { name: 'E-postamı doğrula' });
    expect(api.calls.some((call) => call.path === '/auth/verify-email')).toBe(false);

    await userEvent.setup().click(button);

    const heading = await screen.findByRole('heading', { name: 'E-postan doğrulandı' });
    expect(heading).toHaveFocus();
    expect(api.calls.find((call) => call.path === '/auth/verify-email')?.body).toEqual({
      token: CODE,
    });
    // Oturum sunucudan yeniden okunur: kaydet düğmeleri hemen çalışır.
    await waitFor(() =>
      expect(api.calls.filter((call) => call.path === '/auth/me')).toHaveLength(2),
    );
    expect(screen.getByRole('link', { name: 'Keşfetmeye başla' })).toHaveAttribute('href', '/');
  });

  it('geçersiz bağlantıda doğrula düğmesini kaldırır, yeni bağlantı istetir', async () => {
    const api = mockApi({
      'GET /auth/me': { body: { user: unverified } },
      'POST /auth/verify-email': apiError(
        400,
        'Doğrulama bağlantısı geçersiz ya da süresi dolmuş.',
      ),
      'POST /auth/verify-email/resend': { status: 204 },
    });
    renderApp(routes, `/eposta-dogrula?kod=${CODE}`);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'E-postamı doğrula' }));

    // Odak başlığa geçer: kaybolan düğmeyle birlikte kaybolmaz, ekran okuyucu yeni durumu duyar.
    expect(await screen.findByRole('heading', { name: 'Bağlantı geçersiz' })).toHaveFocus();
    expect(
      screen.getByText('Doğrulama bağlantısı geçersiz ya da süresi dolmuş.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'E-postamı doğrula' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Bağlantıyı tekrar gönder' }));

    expect(await screen.findByText(/Yeni bağlantı gönderildi/)).toBeInTheDocument();
    expect(api.calls.some((call) => call.path === '/auth/verify-email/resend')).toBe(true);
  });

  it('geçersiz bağlantıyı açan ziyaretçiyi girişe yönlendirir', async () => {
    mockApi({
      'POST /auth/verify-email': apiError(
        400,
        'Doğrulama bağlantısı geçersiz ya da süresi dolmuş.',
      ),
    });
    renderApp(routes, `/eposta-dogrula?kod=${CODE}`);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'E-postamı doğrula' }));

    expect(
      await screen.findByRole('link', { name: 'Yeni bağlantı için giriş yap' }),
    ).toHaveAttribute('href', `/giris?next=${encodeURIComponent('/eposta-dogrula')}`);
    expect(screen.queryByRole('button', { name: 'Bağlantıyı tekrar gönder' })).toBeNull();
  });

  it('sunucuya ulaşılamazsa düğme kalır, tekrar denenebilir', async () => {
    mockApi({
      'GET /auth/me': { body: { user: unverified } },
      'POST /auth/verify-email': apiError(503, 'Sunucuya ulaşılamadı.'),
    });
    renderApp(routes, `/eposta-dogrula?kod=${CODE}`);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'E-postamı doğrula' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Sunucuya ulaşılamadı.');
    expect(screen.getByRole('button', { name: 'E-postamı doğrula' })).toBeEnabled();
  });
});

describe('kayıttan sonraki ekran', () => {
  it('adresi gösterir; tekrar gönderme hatasını satır içinde söyler', async () => {
    mockApi({
      'GET /auth/me': { body: { user: unverified } },
      'POST /auth/verify-email/resend': apiError(429, 'Çok fazla doğrulama e-postası istendi.'),
    });
    renderApp(routes, `/eposta-dogrula?next=${encodeURIComponent('/film/27205')}`);

    expect(
      await screen.findByRole('heading', { name: 'E-postanı kontrol et' }),
    ).toBeInTheDocument();
    expect(screen.getByText(testUser.email)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Şimdilik gezinmeye devam et' })).toHaveAttribute(
      'href',
      '/film/27205',
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Bağlantıyı tekrar gönder' }));

    expect(await screen.findByText('Çok fazla doğrulama e-postası istendi.')).toBeInTheDocument();
  });

  it('başka siteye götüren dönüş adresini yok sayar', async () => {
    mockApi({ 'GET /auth/me': { body: { user: unverified } } });
    renderApp(routes, `/eposta-dogrula?next=${encodeURIComponent('//kotu.example')}`);

    expect(
      await screen.findByRole('link', { name: 'Şimdilik gezinmeye devam et' }),
    ).toHaveAttribute('href', '/');
  });
});
