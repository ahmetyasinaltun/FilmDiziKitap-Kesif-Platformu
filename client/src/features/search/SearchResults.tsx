import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { posterGrid } from '../../components/button-styles';
import { CoverFrame, PosterCard, QueryPosterRow } from '../../components/PosterRow';
import { QueryError } from '../../components/QueryError';
import {
  contentPath,
  personPath,
  type ContentSummary,
  type PersonSummary,
  type SearchResult,
} from '../../lib/content';
import { formatCount, formatRating } from '../../lib/format';
import { departmentLabel } from '../../lib/labels';
import { tmdbImage, tmdbSrcSet } from '../../lib/tmdb-image';
import { useTrending } from '../discover/use-discover';
import { RoomLight } from '../perde/Perde';
import { useRoomLight } from '../perde/use-room-light';
import {
  MIN_QUERY_LENGTH,
  SEARCH_TABS,
  uniqueResults,
  useSearch,
  type SearchTab,
} from './use-search';

const PREVIEW_SIZE = 6;
const TITLES_PREVIEW_SIZE = 12;
const SUGGESTION_SIZE = 6;

const isPerson = (item: SearchResult): item is PersonSummary => item.type === 'person';
const isContent = (item: SearchResult): item is ContentSummary => item.type !== 'person';

function PersonCard({ person }: { person: PersonSummary }) {
  const department = departmentLabel(person.department);

  return (
    <Link to={personPath(person.id)} className="group block">
      <CoverFrame title={person.name}>
        {person.profile && (
          <img
            src={tmdbImage(person.profile, 'w185')}
            srcSet={tmdbSrcSet(person.profile, ['w185', 'w342'])}
            sizes="(min-width: 64rem) 11rem, 8rem"
            loading="lazy"
            decoding="async"
            alt=""
            className="relative size-full object-cover brightness-90 transition-[filter] duration-200 group-hover:brightness-110"
          />
        )}
      </CoverFrame>
      <h3 className="mt-2 line-clamp-2 font-medium leading-snug">{person.name}</h3>
      {department && <p className="text-sm text-light-dim">{department}</p>}
    </Link>
  );
}

function ResultCard({ item }: { item: SearchResult }) {
  return isPerson(item) ? <PersonCard person={item} /> : <PosterCard item={item} showType />;
}

function ResultGrid({ items }: { items: SearchResult[] }) {
  return (
    <ul className={posterGrid}>
      {items.map((item) => (
        <li key={`${item.type}-${item.id}`}>
          <ResultCard item={item} />
        </li>
      ))}
    </ul>
  );
}

function GridSkeleton({ count = PREVIEW_SIZE }: { count?: number }) {
  return (
    <div aria-hidden="true" className={posterGrid}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="aspect-[2/3] animate-pulse bg-room-raised motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

function ResultSection({
  title,
  tab,
  children,
}: {
  title: string;
  /** Doluysa o türün tüm sonuçlarına götüren bağlantı gösterilir */
  tab?: SearchTab;
  children: ReactNode;
}) {
  return (
    <section aria-label={title}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-[1.75rem] leading-tight">{title}</h2>
        {tab?.param && <TabLink tab={tab} />}
      </div>
      {children}
    </section>
  );
}

function TabLink({ tab }: { tab: SearchTab }) {
  const [params] = useSearchParams();
  const next = new URLSearchParams(params);
  if (tab.param) next.set('tur', tab.param);

  return (
    <Link
      to={{ search: next.toString() }}
      replace
      className="shrink-0 underline underline-offset-4 hover:no-underline"
    >
      Tümünü gör
    </Link>
  );
}

/** En iyi sonuç küçük perdede durur; odanın ışığı da ondan gelir. */
function TopResult({ item }: { item: ContentSummary }) {
  const backdrop = item.backdrop ?? '';
  const details = [
    item.type === 'movie' ? 'Film' : 'Dizi',
    item.year,
    item.rating != null ? formatRating(item.rating) : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');

  return (
    <Link
      to={contentPath(item.type, item.id)}
      className="group relative block aspect-video overflow-hidden bg-room-raised sm:aspect-[2.39/1]"
    >
      <img
        src={tmdbImage(backdrop, 'w1280')}
        srcSet={tmdbSrcSet(backdrop, ['w780', 'w1280'])}
        sizes="(min-width: 40rem) 70rem, 100vw"
        alt=""
        decoding="async"
        className="size-full object-cover object-[center_30%] brightness-95 transition-[filter] duration-200 group-hover:brightness-110"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-room/70 to-transparent px-3 pb-3 pt-16 text-center sm:pb-6">
        <h2 className="subtitle-text text-xl font-medium leading-snug sm:text-[1.6875rem]">
          {item.title}
        </h2>
        <p className="subtitle-text sm:text-lg">{details}</p>
      </div>
    </Link>
  );
}

function NoResults({ q }: { q: string }) {
  return (
    <div className="py-8">
      <p className="text-lg">“{q}” için sonuç bulunamadı.</p>
      <p className="mt-1 text-light-dim">Yazımı kontrol et ya da daha kısa bir ifade dene.</p>
    </div>
  );
}

function AllResults({ q }: { q: string }) {
  const titles = useSearch<SearchResult>('titles', q);
  const books = useSearch<ContentSummary>('book', q);

  const results = uniqueResults(titles.data?.pages);
  const works = results.filter(isContent);
  const people = results.filter(isPerson);
  const bookItems = uniqueResults(books.data?.pages);

  const top = works[0]?.backdrop ? works[0] : undefined;
  const others = (top ? works.slice(1) : works).slice(0, TITLES_PREVIEW_SIZE);
  useRoomLight(top?.backdrop ?? null);

  const bothDone = titles.isSuccess && books.isSuccess;
  const stale = titles.isPlaceholderData || books.isPlaceholderData;
  if (bothDone && !stale && results.length === 0 && bookItems.length === 0) {
    return <NoResults q={q} />;
  }

  const tab = (id: SearchTab['id']) => SEARCH_TABS.find((item) => item.id === id);
  const showBooks = !titles.isPending;

  return (
    <div
      aria-busy={titles.isFetching || books.isFetching}
      className={`space-y-12 transition-opacity duration-200 ${titles.isPlaceholderData ? 'opacity-60' : ''}`}
    >
      {top?.backdrop && <RoomLight path={top.backdrop} />}
      {top && <TopResult item={top} />}

      {titles.isPending && <GridSkeleton />}
      {titles.isError && (
        <QueryError message={titles.error.message} onRetry={() => void titles.refetch()} />
      )}
      {others.length > 0 && (
        <ResultSection title="Film ve diziler">
          <ResultGrid items={others} />
        </ResultSection>
      )}
      {people.length > 0 && (
        <ResultSection title="Kişiler" tab={tab('person')}>
          <ResultGrid items={people.slice(0, PREVIEW_SIZE)} />
        </ResultSection>
      )}

      {/* Open Library yavaş kalabilir: film sonuçları onu beklemez, kitaplar sonradan gelir.
          Kitap bölümü film sonuçlarından önce görünmez: ilk ekranda dururken film sonuçları
          gelince aşağı itilirdi (yerleşim kayması). */}
      {showBooks && books.isPending && (
        <ResultSection title="Kitaplar">
          <GridSkeleton />
        </ResultSection>
      )}
      {showBooks && books.isError && (
        <ResultSection title="Kitaplar">
          <QueryError message={books.error.message} onRetry={() => void books.refetch()} />
        </ResultSection>
      )}
      {showBooks && bookItems.length > 0 && (
        <ResultSection title="Kitaplar" tab={tab('book')}>
          <ResultGrid items={bookItems.slice(0, PREVIEW_SIZE)} />
        </ResultSection>
      )}
    </div>
  );
}

function TabResults({ q, tab }: { q: string; tab: SearchTab }) {
  const search = useSearch<SearchResult>(tab.type, q);
  const items = uniqueResults(search.data?.pages);
  const total = search.data?.pages[0]?.totalResults ?? 0;

  if (search.isPending) return <GridSkeleton count={12} />;
  if (search.isError && items.length === 0) {
    return <QueryError message={search.error.message} onRetry={() => void search.refetch()} />;
  }
  if (items.length === 0 && !search.isPlaceholderData) return <NoResults q={q} />;

  return (
    <div
      aria-busy={search.isFetching}
      className={`transition-opacity duration-200 ${search.isPlaceholderData ? 'opacity-60' : ''}`}
    >
      <p role="status" className="mb-4 text-light-dim">
        {formatCount(total)} sonuç
      </p>
      <ResultGrid items={items} />
      {search.isFetchNextPageError && (
        <div className="mt-6">
          <QueryError
            message={search.error?.message ?? 'Daha fazla sonuç alınamadı.'}
            onRetry={() => void search.fetchNextPage()}
          />
        </div>
      )}
      {search.hasNextPage && !search.isFetchNextPageError && (
        <button
          type="button"
          disabled={search.isFetchingNextPage}
          onClick={() => void search.fetchNextPage()}
          className="pressable mx-auto mt-10 flex h-12 cursor-pointer items-center rounded-full bg-light/10 px-6 font-bold text-light shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-light/15 disabled:cursor-default disabled:opacity-60"
        >
          {search.isFetchingNextPage ? 'Yükleniyor…' : 'Daha fazla göster'}
        </button>
      )}
    </div>
  );
}

function Suggestions({ tooShort }: { tooShort: boolean }) {
  const trending = useTrending();

  return (
    <div className="space-y-8">
      {tooShort && <p className="text-light-dim">Aramak için en az iki harf yaz.</p>}
      <QueryPosterRow title="Bu hafta öne çıkanlar" query={trending} limit={SUGGESTION_SIZE} />
    </div>
  );
}

export function SearchResults({ q, tab }: { q: string; tab: SearchTab }) {
  if (q.length < MIN_QUERY_LENGTH) return <Suggestions tooShort={q.length > 0} />;
  if (tab.id === 'all') return <AllResults q={q} />;
  return <TabResults key={tab.id} q={q} tab={tab} />;
}
