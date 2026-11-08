import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { filmButton, quietButton } from '../../components/button-styles';
import { ExpandableText } from '../../components/ExpandableText';
import { authorPath, contentPath, type BookDetail, type ContentSummary } from '../../lib/content';
import { LibraryControl, LibraryRating } from '../library/LibraryControl';
import { LitCover } from '../perde/LitCover';
import { useRoomLight } from '../perde/use-room-light';
import { vitrinTitleSize } from '../titles/title-size';
import { bookMeta } from './book-meta';

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
  const lang = english ? 'en' : undefined;

  return (
    <div className={boxClass}>
      {preview ? (
        // Vitrinde paragraflar tek akışa iner: satır sonu kısaltmayla birleşip dört nokta üretmesin.
        <p lang={lang} className="line-clamp-4 max-w-[65ch] text-lg leading-relaxed">
          {description.text}
        </p>
      ) : (
        <ExpandableText text={description.text} lang={lang} />
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

/**
 * Kapak ışığı kapağın birkaç katı geniş: bölüm yatayda kırpar, yoksa telefonda sayfa yana taşar.
 * `clip` yalnızca yatay eksende kırpar; kapağın altındaki yansıma görünür kalır.
 *
 * Kapak, başlık, açıklama ve eylemler: kitap bölümü vitrini ile kitap sayfasının ortak sahnesi. */
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
    <section
      aria-label={linkToDetail ? 'Öne çıkan kitap' : undefined}
      className="relative overflow-x-clip"
    >
      <div className="perde-width relative pt-2">
        <div className="page-gutter grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-14">
          <LitCover title={summary.title} image={summary.poster} />

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

            {/* Vitrinde tek satır (sabit yuva); kitap sayfasında sarar: kırpan kutu yazar
                bağlantılarının odak halkasını da keserdi. */}
            <p className={`mt-2 text-lg sm:text-xl ${linkToDetail ? 'truncate' : ''}`}>
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

const pulse = 'animate-pulse bg-room-raised motion-reduce:animate-none';

/**
 * Kitap sahnesiyle aynı yuvalar: kapak, başlık, yazar, künye, düğme ve açıklama. Vitrinde başlık
 * ve açıklama sabit yükseklikte olduğu için iskelet de aynı yüksekliği tutar; eksik yuvalar
 * telefonda sırayı 470 piksel aşağı itiyordu.
 */
export function BookStageSkeleton({
  vitrin = false,
  children,
}: {
  vitrin?: boolean;
  children?: ReactNode;
}) {
  return (
    <div aria-busy="true" aria-label="Yükleniyor" className="perde-width pt-2">
      <div className="page-gutter grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-14">
        <div className={`mx-auto aspect-[2/3] w-44 self-start sm:w-52 lg:w-full ${pulse}`} />
        <div className="min-w-0 lg:pt-2">
          <div
            className={`flex items-end ${vitrin ? 'h-14 sm:h-[4.5rem] lg:h-[4.875rem]' : 'h-11 sm:h-[3.75rem] lg:h-[4.5rem]'}`}
          >
            <div className={`h-10 w-2/3 max-w-96 sm:h-12 ${pulse}`} />
          </div>
          <div className="mt-2 flex h-7 items-center">
            <div className={`h-5 w-1/3 max-w-60 ${pulse}`} />
          </div>
          <div className="mt-1 flex h-6 items-center sm:h-7">
            <div className={`h-4 w-1/2 max-w-72 ${pulse}`} />
          </div>
          <div className={`mt-5 h-12 w-40 rounded-full sm:h-[3.375rem] ${pulse}`} />
          <div className={`mt-8 space-y-3 pt-1 ${vitrin ? 'min-h-[9.25rem]' : ''}`}>
            {['w-full', 'w-full', 'w-11/12', 'w-2/3'].map((width, index) => (
              <div key={index} className={`h-4 ${width} ${pulse}`} />
            ))}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
