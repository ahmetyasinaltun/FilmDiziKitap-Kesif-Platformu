import type { UseQueryResult } from '@tanstack/react-query';
import { useId } from 'react';
import { Link } from 'react-router';
import { titlePath, type TitleSummary } from '../lib/content';
import { formatRating } from '../lib/format';
import { tmdbImage, tmdbSrcSet } from '../lib/tmdb-image';
import { QueryError } from './QueryError';

const SKELETON_COUNT = 6;
const scrollClass =
  'row-scroll -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 py-1.5 sm:mx-0 sm:px-1.5 lg:grid lg:gap-5 lg:overflow-visible lg:p-0';

const summaryLine = (item: TitleSummary) =>
  [item.year, item.rating != null ? formatRating(item.rating) : null]
    .filter((part) => part !== null)
    .join(' · ');

function PosterCard({ item }: { item: TitleSummary }) {
  const details = summaryLine(item);

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
      <h3 className="mt-2 line-clamp-2 font-medium leading-snug">{item.title}</h3>
      {details && <p className="text-sm text-light-dim">{details}</p>}
    </Link>
  );
}

/** Küçük perde: sahne görseli ve altyazı olarak ad. Ana sahnenin diliyle konuşur. */
function ScreenCard({ item }: { item: TitleSummary }) {
  const image = item.backdrop ?? item.poster;
  const details = summaryLine(item);

  return (
    <Link
      to={titlePath(item.type, item.id)}
      className="group relative block aspect-video overflow-hidden bg-room-raised"
    >
      {image && (
        <img
          src={tmdbImage(image, 'w780')}
          srcSet={tmdbSrcSet(image, ['w300', 'w780'])}
          sizes="(min-width: 64rem) 23rem, 20rem"
          loading="lazy"
          decoding="async"
          alt=""
          className="size-full object-cover object-[center_30%] brightness-90 transition-[filter] duration-200 group-hover:brightness-110"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-room/80 to-transparent px-3 pb-3 pt-12 text-center">
        <h3 className="subtitle-text line-clamp-2 text-lg font-medium leading-snug">
          {item.title}
        </h3>
        {details && <p className="subtitle-text text-sm">{details}</p>}
      </div>
    </Link>
  );
}

const LAYOUTS = {
  poster: {
    Card: PosterCard,
    columns: 'lg:grid-cols-6',
    cell: 'w-36 shrink-0 snap-start sm:w-40 lg:w-auto',
    ratio: 'aspect-[2/3]',
  },
  screen: {
    Card: ScreenCard,
    columns: 'lg:grid-cols-3',
    cell: 'w-72 shrink-0 snap-start sm:w-80 lg:w-auto',
    ratio: 'aspect-video',
  },
};

type RowLayout = keyof typeof LAYOUTS;

interface PosterRowProps {
  title: string;
  items: TitleSummary[];
  layout?: RowLayout;
}

export function PosterRow({ title, items, layout = 'poster' }: PosterRowProps) {
  const headingId = useId();
  const { Card, columns, cell } = LAYOUTS[layout];
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-[1.75rem] leading-tight">
        {title}
      </h2>
      <ul className={`mt-2.5 lg:mt-4 ${scrollClass} ${columns}`}>
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`} className={cell}>
            <Card item={item} />
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
  layout?: RowLayout;
}

export function QueryPosterRow({ title, query, limit, layout = 'poster' }: QueryPosterRowProps) {
  if (query.isPending) {
    const { columns, cell, ratio } = LAYOUTS[layout];
    return (
      <section aria-busy="true" aria-label={`${title} yükleniyor`}>
        <div className="h-9 w-40 animate-pulse bg-room-raised motion-reduce:animate-none" />
        <div className={`mt-2.5 lg:mt-4 ${scrollClass} ${columns}`}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <div key={index} className={cell}>
              <div className={`${ratio} animate-pulse bg-room-raised motion-reduce:animate-none`} />
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

  return <PosterRow title={title} items={query.data.slice(0, limit)} layout={layout} />;
}
