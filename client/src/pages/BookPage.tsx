import { Link, useParams } from 'react-router';
import { QueryError } from '../components/QueryError';
import { BookStage, BookStageSkeleton } from '../features/books/BookStage';
import { useBook } from '../features/books/use-books';
import { ApiError } from '../lib/api';
import { pageTitle } from '../lib/brand';
import type { BookDetail } from '../lib/content';

function BookFacts({ book }: { book: BookDetail }) {
  const facts = [
    { label: 'Yayınevi', value: book.publisher },
    { label: 'Sayfa', value: book.pageCount },
    { label: 'İlk yayın', value: book.year },
    { label: 'Özgün adı', value: book.originalTitle },
    { label: 'Baskı sayısı', value: book.editionCount || null },
    { label: 'ISBN', value: book.isbn },
  ].filter((fact) => fact.value !== null);

  return (
    <section aria-labelledby="kunye" className="perde-width page-gutter mt-12">
      <h2 id="kunye" className="font-display text-[1.75rem] leading-tight">
        Künye
      </h2>
      <dl className="mt-3 max-w-xl divide-y divide-line">
        {facts.map(({ label, value }) => (
          <div key={label} className="flex items-baseline justify-between gap-6 py-2">
            <dt className="shrink-0 text-light-dim">{label}</dt>
            <dd className="min-w-0 text-right tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-light-dim">
        Kitap verileri:{' '}
        <a
          href={book.links.openLibrary}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-light"
        >
          Open Library
        </a>
      </p>
    </section>
  );
}

function BookContent({ id }: { id: string }) {
  const book = useBook(id);

  if (book.isPending) return <BookStageSkeleton />;

  if (book.isError) {
    const notFound =
      (book.error instanceof ApiError && book.error.status === 404) ||
      (book.error instanceof ApiError && book.error.status === 400);
    return (
      <div className="perde-width page-gutter py-16">
        {notFound ? (
          <>
            <h1 className="font-display text-[2.5rem] leading-tight">Bu kitap bulunamadı</h1>
            <p className="mt-2 text-light-dim">Bağlantı hatalı olabilir ya da kayıt kaldırılmış.</p>
            <Link to="/kitap" className="mt-4 inline-block underline underline-offset-4">
              Kitaplara dön
            </Link>
          </>
        ) : (
          <QueryError message={book.error.message} onRetry={() => void book.refetch()} />
        )}
      </div>
    );
  }

  return (
    <>
      <title>{pageTitle(book.data.title)}</title>
      <BookStage summary={book.data} detail={book.data} detailStatus="success" />
      <BookFacts book={book.data} />
    </>
  );
}

export function BookPage() {
  const { id = '' } = useParams();
  return <BookContent key={id} id={id} />;
}
