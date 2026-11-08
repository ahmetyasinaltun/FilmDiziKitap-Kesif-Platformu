import { useParams } from 'react-router';
import { useSession } from '../features/auth/use-auth';
import { LibraryShelf } from '../features/library/LibraryShelf';
import { useShelfList } from '../features/library/shelf-filters';
import { PageError } from '../features/people/PortraitStage';
import { ApiError } from '../lib/api';
import { pageTitle } from '../lib/brand';

function ProfileContent({ handle }: { handle: string }) {
  const { user } = useSession();
  // Raf da aynı sorguyu okur; burada sadece kullanıcının var olup olmadığına bakılır.
  const { list } = useShelfList(handle);

  if (
    list.isError &&
    list.error instanceof ApiError &&
    (list.error.status === 404 || list.error.status === 400)
  ) {
    return (
      <PageError
        error={list.error}
        notFoundTitle="Bu kullanıcı bulunamadı"
        onRetry={() => void list.refetch()}
      />
    );
  }

  return (
    <div className="perde-width page-gutter pt-4 sm:pt-8">
      <title>{pageTitle(`@${handle}`)}</title>
      {/* Kullanıcı adı 20 karaktere kadar: telefonda küçülür, sığmazsa kesilmez, alt satıra geçer. */}
      <h1 className="font-display text-[2rem] leading-tight [overflow-wrap:anywhere] sm:text-[3.5rem]">
        @{handle}
      </h1>
      <p className="text-light-dim">Kütüphane</p>
      <LibraryShelf username={handle} own={user?.username === handle} />
    </div>
  );
}

/** Herkese açık profil: kullanıcının kütüphanesi, giriş gerekmez. */
export function ProfilePage() {
  const { username = '' } = useParams();
  const handle = username.toLowerCase();
  return <ProfileContent key={handle} handle={handle} />;
}
