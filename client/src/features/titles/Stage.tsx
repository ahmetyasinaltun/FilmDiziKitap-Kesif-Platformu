import { useCallback, useRef, useState, type ReactNode, type Ref } from 'react';
import { Link } from 'react-router';
import { filmButton } from '../../components/button-styles';
import { LibraryControl, LibraryRating } from '../library/LibraryControl';
import { Perde, RoomLight } from '../perde/Perde';
import { useRoomLight } from '../perde/use-room-light';
import { contentPath, type TitleDetail, type TitleSummary } from '../../lib/content';
import { metaLine, scoreLine, whereLine } from './decision';
import { vitrinTitleSize } from './title-size';

function DecisionSubtitle({
  detail,
  failed,
  inTheaters,
}: {
  detail: TitleDetail | undefined;
  failed: boolean;
  inTheaters: boolean;
}) {
  if (failed) {
    return (
      <p className="subtitle-text text-center text-[0.9375rem] font-medium sm:text-xl">
        Puan ve platform bilgisi şu an alınamadı.
      </p>
    );
  }

  if (!detail) {
    return (
      <div aria-hidden="true" className="flex flex-col items-center gap-2">
        <div className="h-4 w-3/5 animate-pulse bg-light/20 motion-reduce:animate-none sm:h-6" />
        <div className="h-4 w-2/5 animate-pulse bg-light/20 motion-reduce:animate-none sm:h-6" />
      </div>
    );
  }

  const score = scoreLine(detail);
  return (
    <p className="subtitle-text text-center text-[0.9375rem] font-medium leading-snug sm:text-xl lg:text-[1.6875rem] lg:leading-[1.32]">
      {score && (
        <>
          {score}
          <br />
        </>
      )}
      {whereLine(detail.watchProviders, inTheaters)}
    </p>
  );
}

interface ActionsProps {
  type: TitleSummary['type'];
  id: string;
  compact: boolean;
  trailerKey: string | null;
  /** Detay gelene kadar düğme yerini korur; yoksa seçim anında düğmeler yer değiştirirdi. */
  loading: boolean;
  onPlay: () => void;
  trailerButton: Ref<HTMLButtonElement>;
}

function Actions({ type, id, compact, trailerKey, loading, onPlay, trailerButton }: ActionsProps) {
  return (
    <div className="flex shrink-0 flex-wrap gap-3 lg:justify-end lg:pt-3">
      {(trailerKey || loading) && (
        <button
          ref={trailerButton}
          type="button"
          onClick={onPlay}
          disabled={!trailerKey}
          className={filmButton}
        >
          Fragmanı izle
        </button>
      )}
      <LibraryControl type={type} id={id} compact={compact} />
    </div>
  );
}

interface StageProps {
  summary: Pick<TitleSummary, 'type' | 'id' | 'title' | 'year' | 'poster' | 'backdrop'>;
  /** Yüklenene kadar altyazı ve künye yer tutucu gösterir. */
  detail: TitleDetail | undefined;
  detailStatus: 'pending' | 'error' | 'success';
  inTheaters: boolean;
  /** Ana sayfada başlık ayrıntıya götürür; detay sayfasında sayfanın ana başlığıdır. */
  linkToDetail?: boolean;
  /** Perdenin altındaki film sırası */
  children?: ReactNode;
}

/** Perde, başlık ve eylemler: ana sayfa vitrini ile detay sayfasının ortak sahnesi. */
export function Stage({
  summary,
  detail,
  detailStatus,
  inTheaters,
  linkToDetail = false,
  children,
}: StageProps) {
  const image = summary.backdrop ?? detail?.backdrop ?? summary.poster;
  useRoomLight(image ?? null);

  // Başka yapıma geçilince fragman kendiliğinden kapanır.
  const [trailerOf, setTrailerOf] = useState<string | null>(null);
  const trailerButton = useRef<HTMLButtonElement>(null);
  const closeTrailer = useCallback(() => {
    setTrailerOf(null);
    trailerButton.current?.focus();
  }, []);
  const trailerKey = detail?.trailer?.key ?? null;
  const playing = trailerOf === summary.id ? trailerKey : null;

  const meta = detail ? metaLine(detail) : summary.year;
  const detailPath = contentPath(summary.type, summary.id);

  return (
    <section aria-label={linkToDetail ? 'Öne çıkan yapım' : undefined} className="relative">
      <RoomLight path={image ?? null} />

      <div className="perde-width relative">
        <Perde
          path={image ?? null}
          title={summary.title}
          playingTrailer={playing}
          onCloseTrailer={closeTrailer}
        >
          <DecisionSubtitle
            detail={detail}
            failed={detailStatus === 'error'}
            inTheaters={inTheaters}
          />
        </Perde>

        <div className="page-gutter mt-5 flex flex-col gap-5 sm:mt-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            {linkToDetail ? (
              <h2 className="flex h-14 items-end sm:h-[4.5rem] lg:h-[4.875rem]">
                <Link
                  to={detailPath}
                  title={summary.title}
                  className={`block truncate py-1 font-display leading-[1.15] tracking-[-0.01em] hover:underline hover:underline-offset-4 ${vitrinTitleSize(summary.title)}`}
                >
                  {summary.title}
                </Link>
              </h2>
            ) : (
              <h1 className="font-display text-[2.5rem] leading-[1.05] tracking-[-0.01em] sm:text-[3.5rem] lg:text-[4.25rem]">
                {summary.title}
              </h1>
            )}
            <div className="mt-2 flex items-baseline gap-4 text-light-dim sm:text-lg">
              <p className={linkToDetail ? 'min-w-0 truncate' : undefined}>{meta}</p>
              {linkToDetail && (
                <Link
                  to={detailPath}
                  className="shrink-0 text-light underline underline-offset-4 hover:no-underline"
                >
                  Ayrıntılar
                </Link>
              )}
            </div>
          </div>

          <Actions
            key={summary.id}
            type={summary.type}
            id={summary.id}
            compact={linkToDetail}
            trailerKey={trailerKey}
            loading={detailStatus === 'pending'}
            onPlay={() => setTrailerOf(summary.id)}
            trailerButton={trailerButton}
          />
        </div>

        {!linkToDetail && (
          <div className="page-gutter lg:flex lg:justify-end">
            <LibraryRating type={summary.type} id={summary.id} />
          </div>
        )}

        {children}
      </div>
    </section>
  );
}

export function StageSkeleton({ children }: { children?: ReactNode }) {
  return (
    <div aria-busy="true" aria-label="Yükleniyor" className="perde-width">
      <div className="aspect-[16/10] animate-pulse bg-room-raised motion-reduce:animate-none sm:aspect-[2.39/1]" />
      <div className="page-gutter mt-6">
        <div className="h-12 w-2/3 max-w-96 animate-pulse bg-room-raised motion-reduce:animate-none" />
        <div className="mt-3 h-5 w-1/2 max-w-72 animate-pulse bg-room-raised motion-reduce:animate-none" />
      </div>
      {children}
    </div>
  );
}
