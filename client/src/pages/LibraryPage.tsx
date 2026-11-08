import { Link, Navigate } from 'react-router';
import { useLogout, useSession } from '../features/auth/use-auth';
import { LibraryShelf } from '../features/library/LibraryShelf';
import { pageTitle } from '../lib/brand';

export function LibraryPage() {
  const { user, isPending } = useSession();
  const logout = useLogout();

  if (isPending) return null;
  // Çıkış sonrası koruma devreye girip giriş sayfasına atmasın: önce bu kontrol.
  if (logout.isSuccess) return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/giris?next=%2Fkutuphane" replace />;

  return (
    <div className="perde-width page-gutter pt-4 sm:pt-8">
      <title>{pageTitle('Kütüphanem')}</title>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h1 className="font-display text-[2.5rem] leading-tight sm:text-[3.5rem]">Kütüphanem</h1>
          <Link
            to={`/u/${encodeURIComponent(user.username)}`}
            className="flex h-11 items-center truncate text-light-dim underline-offset-4 hover:text-light hover:underline"
          >
            @{user.username} · herkese açık profilin
          </Link>
        </div>
        <button
          type="button"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
          className="flex h-11 cursor-pointer items-center text-light-dim underline underline-offset-4 hover:text-light"
        >
          Çıkış yap
        </button>
      </div>

      <LibraryShelf username={user.username} own />
    </div>
  );
}
