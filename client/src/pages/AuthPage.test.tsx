import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { apiError, mockApi, renderApp, testUser } from '../test/app';
import { AuthPage } from './AuthPage';

const routes = [
  { path: '/giris', element: <AuthPage mode="login" /> },
  { path: '/kayit', element: <AuthPage mode="register" /> },
  { path: '/kutuphane', element: <p>Kütüphane sayfası</p> },
  { path: '/film/:id', element: <p>Film sayfası</p> },
];

async function logIn() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Kullanıcı adı veya e-posta'), 'deneme');
  await user.type(screen.getByLabelText('Şifre'), 'gizli-sifre-123');
  await user.click(screen.getByRole('button', { name: 'Giriş yap' }));
}

describe('kayıt', () => {
  it('sunucunun alan hatasını kutunun altında gösterir ve odağı o kutuya taşır', async () => {
    const api = mockApi({
      'POST /auth/register': apiError(409, 'Bu kullanıcı adı alınmış.', {
        username: ['Bu kullanıcı adı alınmış.'],
      }),
    });
    renderApp(routes, '/kayit');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Kullanıcı adı'), 'deneme');
    await user.type(screen.getByLabelText('E-posta'), 'deneme@example.com');
    await user.type(screen.getByLabelText('Şifre'), 'gizli-sifre-123');
    await user.click(screen.getByRole('button', { name: 'Hesap oluştur' }));

    const username = screen.getByLabelText('Kullanıcı adı');
    await waitFor(() => expect(username).toHaveAttribute('aria-invalid', 'true'));
    expect(username).toHaveFocus();
    expect(username).toHaveAccessibleDescription('Bu kullanıcı adı alınmış.');
    // Alan hatası varken aynı mesaj ikinci kez genel uyarı olarak çıkmaz.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(api.calls.find((call) => call.method === 'POST')?.body).toEqual({
      username: 'deneme',
      email: 'deneme@example.com',
      password: 'gizli-sifre-123',
    });
  });
});

describe('giriş', () => {
  it('yanlış şifrede genel hatayı gösterir, düğme tekrar kullanılabilir olur', async () => {
    mockApi({ 'POST /auth/login': apiError(401, 'Kullanıcı adı ya da şifre hatalı.') });
    renderApp(routes, '/giris');

    await logIn();

    expect(await screen.findByRole('alert')).toHaveTextContent('Kullanıcı adı ya da şifre hatalı.');
    expect(screen.getByRole('button', { name: 'Giriş yap' })).toBeEnabled();
  });

  it('girişten sonra geldiği sayfaya döner', async () => {
    mockApi({ 'POST /auth/login': { body: { user: testUser } } });
    const { router } = renderApp(routes, `/giris?next=${encodeURIComponent('/film/27205')}`);

    await logIn();

    expect(await screen.findByText('Film sayfası')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/film/27205');
  });

  it('başka siteye götüren dönüş adresini yok sayar', async () => {
    mockApi({ 'POST /auth/login': { body: { user: testUser } } });
    const { router } = renderApp(routes, `/giris?next=${encodeURIComponent('//kotu.example')}`);

    await logIn();

    expect(await screen.findByText('Kütüphane sayfası')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/kutuphane');
  });
});
