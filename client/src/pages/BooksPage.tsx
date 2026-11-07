import { QueryPosterRow } from '../components/PosterRow';
import { BookVitrin } from '../features/books/BookVitrin';
import { useTrendingBooks } from '../features/books/use-books';
import { pageTitle } from '../lib/brand';

const ROW_SIZE = 6;

export function BooksPage() {
  const trending = useTrendingBooks();

  return (
    <>
      <title>{pageTitle('Kitaplar')}</title>
      <h1 className="sr-only">Kitaplar</h1>
      <BookVitrin />
      <div className="perde-width page-gutter mt-16">
        <QueryPosterRow title="Bu hafta öne çıkanlar" query={trending} limit={ROW_SIZE} />
      </div>
    </>
  );
}
