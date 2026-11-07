import { useCallback, useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { Link } from 'react-router';
import { Perde, RoomLight } from '../perde/Perde';
import { useFilmLight } from '../perde/use-film-color';
import { titlePath, type TitleDetail, type TitleSummary } from '../../lib/content';
import { metaLine, scoreLine, whereLine } from './decision';

const buttonBase =
  'pressable flex h-12 cursor-pointer items-center rounded-full px-6 font-bold sm:h-[3.375rem] sm:px-7 sm:text-lg';

/**
 * Vitrinde başlık tek satır ve sabit yükseklikte. Uzun başlık iki satıra insaydı alttaki sıra
 * kayar, fare başka afişin üstünde kalır ve seçim kendiliğinden değişirdi.
 */
function vitrinTitleSize(title: string): string {
  if (title.length <= 15) return 'text-[2.5rem] sm:text-[3.5rem] lg:text-[3.75rem]';
  if (title.length <= 24) return 'text-[1.75rem] sm:text-[2.5rem] lg:text-[3rem]';
  return 'text-[1.375rem] sm:text-[2rem] lg:text-[2.25rem]';
}

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
  trailerKey: string | null;
  /** Detay gelene kadar düğme yerini korur; yoksa seçim anında düğmeler yer değiştirirdi. */
  loading: boolean;
  onPlay: () => void;
  trailerButton: Ref<HTMLButtonElement>;
}

function Actions({ trailerKey, loading, onPlay, trailerButton }: ActionsProps) {
  const [notice, setNotice] = useState(false);

  return (
    <div className="relative shrink-0 lg:pt-3">
      <div className="flex flex-wrap gap-3 lg:justify-end">
        {(trailerKey || loading) && (
          <button
            ref={trailerButton}
            type="button"
            onClick={onPlay}
            disabled={!trailerKey}
            className={`${buttonBase} bg-film text-film-ink hover:brightness-110 disabled:cursor-default disabled:opacity-60`}
          >
            Fragmanı izle
          </button>
        )}
        <button
          type="button"
          onClick={() => setNotice(true)}
          className={`${buttonBase} bg-light/10 text-light shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-light/15`}
        >
          İzleyeceğim
        </button>
      </div>
      <p
        role="status"
        className="mt-2 text-sm text-light-dim empty:mt-0 lg:absolute lg:right-0 lg:top-full lg:mt-1 lg:whitespace-nowrap"
      >
        {notice && (
          <>
            Kaydetmek için{' '}
            <Link to="/giris" className="underline underline-offset-4 hover:text-light">
              giriş yap
            </Link>
            .
          </>
        )}
      </p>
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
  const light = useFilmLight(image ?? null);

  // Kökte ayarla: menü, afiş sıraları, odak halkası ve seçim rengi de filmi izlesin.
  useEffect(() => {
    if (!light) return;
    const { style } = document.documentElement;
    if (light.color) style.setProperty('--color-film', light.color);
    style.setProperty('--light-strength', String(light.strength));
    return () => {
      style.removeProperty('--color-film');
      style.removeProperty('--light-strength');
    };
  }, [light]);

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
  const detailPath = titlePath(summary.type, summary.id);

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
            trailerKey={trailerKey}
            loading={detailStatus === 'pending'}
            onPlay={() => setTrailerOf(summary.id)}
            trailerButton={trailerButton}
          />
        </div>

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
