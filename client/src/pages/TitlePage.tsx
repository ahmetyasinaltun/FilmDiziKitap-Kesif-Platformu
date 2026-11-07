import { Link, useParams } from 'react-router';
import { PosterRow } from '../components/PosterRow';
import { QueryError } from '../components/QueryError';
import { useNowPlaying } from '../features/discover/use-discover';
import { Stage, StageSkeleton } from '../features/titles/Stage';
import { CastRow, Scores, WhereToWatch } from '../features/titles/TitleFacts';
import { useTitle } from '../features/titles/use-title';
import { ApiError } from '../lib/api';
import { pageTitle } from '../lib/brand';
import type { TitleDetail, TitleSummary, TitleType } from '../lib/content';
import { tmdbImage, tmdbSrcSet } from '../lib/tmdb-image';

function Credits({ title }: { title: TitleDetail }) {
  const rows =
    title.type === 'movie'
      ? [
          { label: 'Yönetmen', people: title.directors },
          { label: 'Senaryo', people: title.writers },
        ]
      : [{ label: 'Yaratıcı', people: title.creators }];

  return (
    <dl className="mt-6 space-y-2">
      {rows
        .filter((row) => row.people.length > 0)
        .map(({ label, people }) => (
          <div key={label} className="flex gap-3">
            <dt className="w-20 shrink-0 text-light-dim">{label}</dt>
            <dd>{people.map((person) => person.name).join(', ')}</dd>
          </div>
        ))}
    </dl>
  );
}

function TitleBody({ title, inTheaters }: { title: TitleDetail; inTheaters: boolean }) {
  return (
    <div className="perde-width page-gutter mt-12 space-y-14 sm:mt-14">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div className="space-y-10 lg:order-2">
          <Scores title={title} />
          <WhereToWatch watch={title.watchProviders} inTheaters={inTheaters} />
        </div>

        <div className="flex gap-8 lg:order-1">
          {title.poster && (
            <img
              src={tmdbImage(title.poster, 'w342')}
              srcSet={tmdbSrcSet(title.poster, ['w185', 'w342'])}
              sizes="16rem"
              alt={`${title.title} afişi`}
              loading="lazy"
              decoding="async"
              className="hidden aspect-[2/3] w-64 shrink-0 self-start object-cover sm:block"
            />
          )}
          <div className="min-w-0">
            <h2 className="font-display text-[1.75rem] leading-tight">Özet</h2>
            <p className="mt-3 max-w-[65ch] text-lg leading-relaxed">
              {title.overview ?? 'Bu yapım için Türkçe özet bulunamadı.'}
            </p>
            <Credits title={title} />
          </div>
        </div>
      </div>

      <CastRow cast={title.cast} />
      <PosterRow title="Benzer yapımlar" items={title.recommendations as TitleSummary[]} />
    </div>
  );
}

function TitleContent({ type, id }: { type: TitleType; id: string }) {
  const title = useTitle(type, id);
  const nowPlaying = useNowPlaying();

  if (title.isPending) return <StageSkeleton />;

  if (title.isError) {
    if (title.error instanceof ApiError && title.error.status === 404) {
      return (
        <div className="perde-width page-gutter py-16">
          <h1 className="font-display text-[2.5rem] leading-tight">Bu yapım bulunamadı</h1>
          <p className="mt-2 text-light-dim">Bağlantı hatalı olabilir ya da yapım kaldırılmış.</p>
          <Link to="/" className="mt-4 inline-block underline underline-offset-4">
            Ana sayfaya dön
          </Link>
        </div>
      );
    }
    return (
      <div className="perde-width page-gutter py-16">
        <QueryError message={title.error.message} onRetry={() => void title.refetch()} />
      </div>
    );
  }

  const inTheaters = type === 'movie' && (nowPlaying.data?.some((item) => item.id === id) ?? false);

  return (
    <>
      <title>{pageTitle(title.data.title)}</title>
      <Stage summary={{ ...title.data, type }} detail={title.data} inTheaters={inTheaters} />
      <TitleBody title={title.data} inTheaters={inTheaters} />
    </>
  );
}

export function TitlePage({ type }: { type: TitleType }) {
  const { id = '' } = useParams();
  return <TitleContent key={`${type}-${id}`} type={type} id={id} />;
}
