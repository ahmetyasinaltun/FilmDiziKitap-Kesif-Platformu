import { Navigate, useSearchParams } from 'react-router';
import { AuthForm } from '../features/auth/AuthForm';
import { useSession } from '../features/auth/use-auth';
import { pageTitle } from '../lib/brand';
import { safeNextPath } from '../lib/safe-path';

const COPY = {
  login: { title: 'Giriş yap', lead: 'Kütüphanene kaldığın yerden devam et.' },
  register: {
    title: 'Hesap oluştur',
    lead: 'İzlediklerini ve okuduklarını kaydet, puanla, sırada ne olduğunu unutma.',
  },
};

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user } = useSession();
  const [params] = useSearchParams();
  const { title, lead } = COPY[mode];

  if (user) return <Navigate to={safeNextPath(params.get('next'), '/kutuphane')} replace />;

  return (
    <div className="page-gutter mx-auto w-full max-w-md pt-6 sm:pt-14">
      <title>{pageTitle(title)}</title>
      <h1 className="font-display text-[2.5rem] leading-tight sm:text-[3.5rem]">{title}</h1>
      <p className="mt-2 text-lg text-light-dim">{lead}</p>
      <AuthForm mode={mode} />
    </div>
  );
}
