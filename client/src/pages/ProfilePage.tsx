import { useParams } from 'react-router';
import { useSession } from '../features/auth/use-auth';
import { LibraryShelf } from '../features/library/LibraryShelf';
import { pageTitle } from '../lib/brand';

/** Herkese açık profil: kullanıcının kütüphanesi, giriş gerekmez. */
export function ProfilePage() {
  const { username = '' } = useParams();
  const { user } = useSession();
  const handle = username.toLowerCase();

  return (
    <div className="perde-width page-gutter pt-4 sm:pt-8">
      <title>{pageTitle(`@${handle}`)}</title>
      <h1 className="truncate font-display text-[2.5rem] leading-tight sm:text-[3.5rem]">
        @{handle}
      </h1>
      <p className="text-light-dim">Kütüphane</p>
      <LibraryShelf key={handle} username={handle} own={user?.username === handle} />
    </div>
  );
}
