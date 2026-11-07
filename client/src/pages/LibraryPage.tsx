import { Link, Navigate, useSearchParams } from 'react-router';
import { pillLink, posterGrid, quietButton } from '../components/button-styles';
import { PosterCard } from '../components/PosterRow';
import { QueryError } from '../components/QueryError';
import { useLogout, useSession } from '../features/auth/use-auth';
import { useLibraryList } from '../features/library/use-library';
import { pageTitle } from '../lib/brand';
import type { LibraryItem, LibraryStatus, MediaType, SessionUser } from '../lib/content';

const TYPE_FILTERS: { param: string | null; label: string; value?: MediaType }[] = [
  { param: null, label: 'Tümü' },
  { param: 'film', label: 'Film', value: 'movie' },
  { param: 'dizi', label: 'Dizi', value: 'tv' },
  { param: 'kitap', label: 'Kitap', value: 'book' },
];

const STATUS_FILTERS: { param: string | null; label: string; value?: LibraryStatus }[] = [
  { param: null, label: 'Hepsi' },
  { param: 'sirada', label: 'Sırada', value: 'planned' },
  { param: 'bitti', label: 'Bitti', value: 'completed' },
];

function itemNote(item: LibraryItem): string {
  if (item.status === 'planned') return 'Sırada';
  return item.rating ? `Puanın: ${item.rating}` : 'Bitti';
}

function FilterRow({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: { param: string | null; label: string }[];
}) {
  const [params] = useSearchParams();
  const current = params.get(name);

  return (
    <nav aria-label={label}>
      <ul className="row-scroll flex gap-1 overflow-x-auto">
        {options.map((option) => {
          const next = new URLSearchParams(params);
          if (option.param) next.set(name, option.param);
          else next.delete(name);
          const selected = option.param === current;

          return (
            <li key={option.label}>
              <Link
                to={{ search: next.toString() }}
                replace
                preventScrollReset
                aria-current={selected ? 'page' : undefined}
                className={pillLink(selected)}
              >
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function LibraryList({ user }: { user: SessionUser }) {
  const [params] = useSearchParams();
  const type = TYPE_FILTERS.find((filter) => filter.param === params.get('tur'))?.value;
  const status = STATUS_FILTERS.find((filter) => filter.param === params.get('durum'))?.value;
  const filtered = type !== undefined || status !== undefined;

  const list = useLibraryList(user.username, { type, status });
  const items = list.data?.pages.flatMap((page) => page.results) ?? [];
  const total = list.data?.pages[0]?.totalResults ?? 0;

  if (list.isPending) {
    return (
      <div aria-hidden="true" className={posterGrid}>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="aspect-[2/3] animate-pulse bg-room-raised motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  }

  if (list.isError) {
    return <QueryError message={list.error.message} onRetry={() => void list.refetch()} />;
  }

  if (items.length === 0) {
    return filtered ? (
      <p className="py-8 text-lg text-light-dim">Bu seçimde kayıt yok.</p>
    ) : (
      <div className="py-8">
        <p className="text-lg">Kütüphanen henüz boş.</p>
        <p className="mt-1 text-light-dim">
          Beğendiğin bir şeyi bulup "İzleyeceğim" ya da "Okuyacağım" dediğinde burada görünür.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/" className={quietButton}>
            Film ve dizilere bak
          </Link>
          <Link to="/kitap" className={quietButton}>
            Kitaplara bak
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <p role="status" className="mb-4 text-light-dim">
        {total} kayıt
      </p>
      <ul className={posterGrid}>
        {items.map((item) => (
          <li key={`${item.content.type}-${item.content.id}`}>
            <PosterCard item={{ ...item.content, rating: null }} note={itemNote(item)} />
          </li>
        ))}
      </ul>
      {list.hasNextPage && (
        <button
          type="button"
          disabled={list.isFetchingNextPage}
          onClick={() => void list.fetchNextPage()}
          className={`${quietButton} mx-auto mt-10`}
        >
          {list.isFetchingNextPage ? 'Yükleniyor…' : 'Daha fazla göster'}
        </button>
      )}
    </>
  );
}

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
          <p className="truncate text-light-dim">@{user.username}</p>
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

      <div className="mt-6 flex flex-col gap-1 sm:flex-row sm:justify-between">
        <FilterRow label="Tür" name="tur" options={TYPE_FILTERS} />
        <FilterRow label="Durum" name="durum" options={STATUS_FILTERS} />
      </div>

      <div className="mt-6">
        <LibraryList user={user} />
      </div>
    </div>
  );
}
