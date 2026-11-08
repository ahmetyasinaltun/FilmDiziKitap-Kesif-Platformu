import { Link } from 'react-router';
import { ExpandableText } from '../../components/ExpandableText';
import { QueryError } from '../../components/QueryError';
import { ApiError } from '../../lib/api';
import { LitCover } from '../perde/LitCover';
import { useRoomLight } from '../perde/use-room-light';

interface PortraitStageProps {
  name: string;
  image: string | null;
  meta: string;
  text: string | null;
  /** Metnin dili Türkçe değilse (Open Library biyografileri İngilizce): ekran okuyucu doğru okusun. */
  lang?: string;
  /** Metnin altındaki kaynak satırı; kaydın kaynaktaki sayfasına bağlanır. */
  source: { name: string; href: string };
  emptyText: string;
}

/** Kişi ve yazar sayfalarının ortak sahnesi: ışık portreden yayılır, yanında ad ve biyografi. */
export function PortraitStage({
  name,
  image,
  meta,
  text,
  lang,
  source,
  emptyText,
}: PortraitStageProps) {
  useRoomLight(image);

  return (
    <section className="relative overflow-x-clip">
      <div className="perde-width relative pt-2">
        <div className="page-gutter grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-14">
          <LitCover title={name} image={image} />
          <div className="min-w-0 lg:pt-2">
            <h1 className="font-display text-[2.5rem] leading-[1.05] tracking-[-0.01em] sm:text-[3.5rem] lg:text-[4.25rem]">
              {name}
            </h1>
            {meta && <p className="mt-2 text-light-dim sm:text-lg">{meta}</p>}
            <div className="mt-8">
              {text ? (
                <ExpandableText text={text} lang={lang} />
              ) : (
                <p className="text-light-dim">{emptyText}</p>
              )}
              <p className="mt-2 text-sm text-light-dim">
                Kaynak:{' '}
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:text-light"
                >
                  {source.name}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PortraitSkeleton() {
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

/** Kişi, yazar ve profil sayfalarında ortak: bulunamadı ya da hata. */
export function PageError({
  error,
  notFoundTitle,
  onRetry,
}: {
  error: Error;
  notFoundTitle: string;
  onRetry: () => void;
}) {
  const notFound = error instanceof ApiError && (error.status === 404 || error.status === 400);

  return (
    <div className="perde-width page-gutter py-16">
      {notFound ? (
        <>
          <h1 className="font-display text-[2.5rem] leading-tight">{notFoundTitle}</h1>
          <p className="mt-2 text-light-dim">Bağlantı hatalı olabilir ya da kayıt kaldırılmış.</p>
          <Link to="/" className="mt-4 inline-block underline underline-offset-4">
            Ana sayfaya dön
          </Link>
        </>
      ) : (
        <QueryError message={error.message} onRetry={onRetry} />
      )}
    </div>
  );
}
