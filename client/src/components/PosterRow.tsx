import type { UseQueryResult } from '@tanstack/react-query';
import { useId } from 'react';
import { Link } from 'react-router';
import { titlePath, type TitleSummary } from '../lib/content';
import { formatRating } from '../lib/format';
import { tmdbImage, tmdbSrcSet } from '../lib/tmdb-image';
import { QueryError } from './QueryError';

const SKELETON_COUNT = 6;
const rowClass =
  'no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 py-1.5 sm:mx-0 sm:px-1.5 lg:grid lg:grid-cols-6 lg:gap-5 lg:overflow-visible lg:px-0';
const cellClass = 'w-36 shrink-0 snap-start sm:w-40 lg:w-auto';

function PosterCard({ item }: { item: TitleSummary }) {
  const details = [item.year, item.rating != null ? formatRating(item.rating) : null]
    .filter((part) => part !== null)
    .join(' · ');

  return (
    <Link to={titlePath(item.type, item.id)} className="group block">
      <div className="aspect-[2/3] overflow-hidden bg-room-raised">
        {item.poster ? (
          <img
            src={tmdbImage(item.poster, 'w342')}
            srcSet={tmdbSrcSet(item.poster, ['w185', 'w342'])}
            sizes="(min-width: 64rem) 11rem, 10rem"
            loading="lazy"
            decoding="async"
            alt=""
            className="size-full object-cover brightness-90 transition-[filter] duration-200 group-hover:brightness-110"
          />
        ) : (
          <span className="grid size-full place-items-center p-3 text-center font-display text-lg">
            {item.title}
          </span>
        )}
      </div>
      <h3 className="mt-2 truncate font-medium">{item.title}</h3>
      {details && <p className="text-sm text-light-dim">{details}</p>}
    </Link>
  );
}

interface PosterRowProps {
  title: string;
  items: TitleSummary[];
}

export function PosterRow({ title, items }: PosterRowProps) {
  const headingId = useId();
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-[1.75rem] leading-tight">
        {title}
      </h2>
      <ul className={`mt-2.5 ${rowClass}`}>
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`} className={cellClass}>
            <PosterCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

interface QueryPosterRowProps {
  title: string;
  query: UseQueryResult<TitleSummary[]>;
  limit: number;
}

export function QueryPosterRow({ title, query, limit }: QueryPosterRowProps) {
  if (query.isPending) {
    return (
      <section aria-busy="true" aria-label={`${title} yükleniyor`}>
        <div className="h-9 w-40 animate-pulse bg-room-raised motion-reduce:animate-none" />
        <div className={`mt-2.5 ${rowClass}`}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <div key={index} className={cellClass}>
              <div className="aspect-[2/3] animate-pulse bg-room-raised motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (query.isError) {
    return (
      <section aria-label={title}>
        <h2 className="mb-4 font-display text-[1.75rem] leading-tight">{title}</h2>
        <QueryError message={query.error.message} onRetry={() => void query.refetch()} />
      </section>
    );
  }

  return <PosterRow title={title} items={query.data.slice(0, limit)} />;
}
