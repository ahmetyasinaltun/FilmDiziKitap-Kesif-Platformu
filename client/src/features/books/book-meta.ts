import type { BookDetail, ContentSummary } from '../../lib/content';
import { formatRating } from '../../lib/format';

/** "1985 · 186 sayfa · Open Library 7,8". Olmayan bilgi yazılmaz, puan uydurulmaz. */
export function bookMeta(
  book: Pick<ContentSummary, 'year' | 'rating'>,
  detail: Pick<BookDetail, 'pageCount'> | undefined,
): string {
  return [
    book.year,
    detail?.pageCount ? `${detail.pageCount}\u00A0sayfa` : null,
    book.rating != null ? `Open Library ${formatRating(book.rating)}` : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');
}
