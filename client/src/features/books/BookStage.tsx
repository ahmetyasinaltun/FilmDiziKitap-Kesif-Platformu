import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { filmButton, quietButton } from '../../components/button-styles';
import { CoverFrame } from '../../components/PosterRow';
import { authorPath, contentPath, type BookDetail, type ContentSummary } from '../../lib/content';
import { LibraryControl, LibraryRating } from '../library/LibraryControl';
import { LightImage } from '../perde/LightImage';
import { RoomLight } from '../perde/Perde';
import { useRoomLight } from '../perde/use-room-light';
import { vitrinTitleSize } from '../titles/title-size';
import { bookMeta } from './book-meta';

/** Kapak geniş perdeye yayılırsa bulanıklaşır; kitapta ışık kaynağı perde değil kapağın kendisidir. */
function BookCover({ title, poster }: { title: string; poster: string | null }) {
  return (
    <div className="relative mx-auto w-44 self-start sm:w-52 lg:sticky lg:top-6 lg:w-full">
      <div aria-hidden="true" className="perde-floor">
        <LightImage path={poster} variant="light" className="room-light-image" />
      </div>
      <CoverFrame title={title} className="perde-screen">
        <LightImage
          path={poster}
          variant="cover"
          className="absolute inset-0 size-full object-cover"
        />
      </CoverFrame>
    </div>
  );
}

/** Bundan uzun metin kısaltılır: telefonda künyeye ulaşmak için çok kaydırmak gerekmesin. */
const LONG_TEXT = 700;

function BookText({
  detail,
  status,
  preview,
}: {
  detail: BookDetail | undefined;
  status: 'pending' | 'error' | 'success';
  /** Vitrinde kısa ve sabit yükseklikte; kitap sayfasında tamamı */
  preview: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const boxClass = preview ? 'min-h-[9.25rem]' : '';

  if (status === 'pending') {
    return (
      <div aria-hidden="true" className={`${boxClass} space-y-3 pt-1`}>
        {['w-full', 'w-full', 'w-11/12', 'w-2/3'].map((width, index) => (
          <div
            key={index}
            className={`h-4 animate-pulse bg-room-raised motion-reduce:animate-none ${width}`}
          />
        ))}
      </div>
    );
  }

  const description = detail?.description;
  if (status === 'error' || !description) {
    return (
      <p className={`${boxClass} text-light-dim`}>
        {status === 'error' ? 'Açıklama şu an alınamadı.' : 'Bu kitap için açıklama bulunamadı.'}
      </p>
    );
  }

  const english = description.source === 'Open Library';
  const long = !preview && description.text.length > LONG_TEXT;
  // Vitrinde paragraflar tek akışa iner: satır sonu kısaltmayla birleşip dört nokta üretmesin.
  const textClass = preview
    ? 'line-clamp-4'
    : `whitespace-pre-line ${long && !expanded ? 'line-clamp-[9]' : ''}`;

  return (
    <div className={boxClass}>
      <p
        lang={english ? 'en' : undefined}
        className={`max-w-[65ch] text-lg leading-relaxed ${textClass}`}
      >
        {description.text}
      </p>
      {long && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex h-11 cursor-pointer items-center underline underline-offset-4 hover:no-underline"
        >
          {expanded ? 'Daha az göster' : 'Devamını oku'}
        </button>
      )}
      <p className="mt-2 text-sm text-light-dim">
        {english && 'Türkçe açıklama bulunamadı. '}
        Kaynak:{' '}
        {description.url ? (
          <a
            href={description.url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-light"
          >
            {description.source}
          </a>
        ) : (
          description.source
        )}
      </p>
    </div>
  );
}

function Authors({ summary, detail }: { summary: BookStageProps['summary']; detail?: BookDetail }) {
  if (detail && detail.authors.length > 0) {
    return detail.authors.map((author, index) => (
      <span key={author.id}>
        {index > 0 && ', '}
        <Link to={authorPath(author.id)} className="hover:underline hover:underline-offset-4">
          {author.name}
        </Link>
      </span>
    ));
  }
  return summary.authorNames?.join(', ') ?? null;
}

interface BookStageProps {
  summary: Pick<ContentSummary, 'id' | 'title' | 'year' | 'rating' | 'poster' | 'authorNames'>;
  detail: BookDetail | undefined;
  detailStatus: 'pending' | 'error' | 'success';
  /** Bölüm vitrininde başlık ayrıntıya götürür; kitap sayfasında sayfanın ana başlığıdır. */
  linkToDetail?: boolean;
  /** Alttaki kitap sırası */
  children?: ReactNode;
}

/** Kapak, başlık, açıklama ve eylemler: kitap bölümü vitrini ile kitap sayfasının ortak sahnesi. */
export function BookStage({
  summary,
  detail,
  detailStatus,
  linkToDetail = false,
  children,
}: BookStageProps) {
  useRoomLight(summary.poster);

  const detailPath = contentPath('book', summary.id);
  const meta = bookMeta(summary, detail);
  const preview = detail?.links.googleBooks;

  return (
    <section aria-label={linkToDetail ? 'Öne çıkan kitap' : undefined} className="relative">
      {summary.poster && <RoomLight path={summary.poster} />}

      <div className="perde-width relative pt-2">
        <div className="page-gutter grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-14">
          <BookCover title={summary.title} poster={summary.poster} />

          <div className="min-w-0 lg:pt-2">
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

            <p className="mt-2 truncate text-lg sm:text-xl">
              <Authors summary={summary} detail={linkToDetail ? undefined : detail} />
            </p>

            <div className="mt-1 flex items-baseline gap-4 text-light-dim sm:text-lg">
              {meta && <p className="min-w-0 truncate">{meta}</p>}
              {linkToDetail && (
                <Link
                  to={detailPath}
                  className="shrink-0 text-light underline underline-offset-4 hover:no-underline"
                >
                  Ayrıntılar
                </Link>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <LibraryControl
                key={summary.id}
                type="book"
                id={summary.id}
                compact={linkToDetail}
                idleClassName={filmButton}
              />
              {preview && (
                <a href={preview} target="_blank" rel="noreferrer" className={quietButton}>
                  Önizle
                </a>
              )}
            </div>

            {!linkToDetail && <LibraryRating type="book" id={summary.id} />}

            <div className="mt-8">
              <BookText detail={detail} status={detailStatus} preview={linkToDetail} />
            </div>
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}

export function BookStageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Yükleniyor" className="perde-width pt-2">
      <div className="page-gutter grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-14">
        <div className="mx-auto aspect-[2/3] w-44 animate-pulse bg-room-raised motion-reduce:animate-none sm:w-52 lg:w-full" />
        <div className="space-y-3 lg:pt-6">
          <div className="h-12 w-2/3 max-w-96 animate-pulse bg-room-raised motion-reduce:animate-none" />
          <div className="h-5 w-1/2 max-w-72 animate-pulse bg-room-raised motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
