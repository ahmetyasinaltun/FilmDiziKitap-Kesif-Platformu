import type { BookDescription, BookDetail } from '../domain/content.js';
import { ProviderError } from '../lib/http.js';
import { logger } from '../lib/logger.js';
import { findTurkishVolume, type GoogleBookMatch } from '../providers/googlebooks/index.js';
import { getBookCore } from '../providers/openlibrary/index.js';
import { normalizeForMatch } from '../providers/openlibrary/mappers.js';

const TURKISH_LETTERS = /[çğıöşüÇĞİÖŞÜ]/g;

/**
 * Open Library bazı Türkçe başlıkları aksansız kaydetmiş ("Ucurtma Avcisi"). Google Books'taki
 * başlık aynı kelimelerse ve daha çok Türkçe harf içeriyorsa o kullanılır.
 */
export function preferTurkishSpelling(current: string, candidate: string | undefined): string {
  if (!candidate || normalizeForMatch(current) !== normalizeForMatch(candidate)) return current;
  const letters = (value: string) => value.match(TURKISH_LETTERS)?.length ?? 0;
  return letters(candidate) > letters(current) ? candidate : current;
}

async function googleVolume(
  id: string,
  title: string,
  author: string | null,
): Promise<GoogleBookMatch | null> {
  try {
    return (await findTurkishVolume(id, title, author)).volume;
  } catch (error) {
    if (!(error instanceof ProviderError)) throw error;
    logger.warn({ provider: error.provider, kind: error.kind }, 'Türkçe açıklama alınamadı');
    return null;
  }
}

/**
 * Kitap detayı: temel veri Open Library'den; Türkçe açıklama Google Books'tan (bulunursa),
 * yoksa Open Library'nin (çoğunlukla İngilizce) açıklaması. Google Books çökerse sayfa yine açılır.
 */
export async function getBookDetail(id: string): Promise<BookDetail> {
  const { openLibraryDescription, ...book } = await getBookCore(id);
  const google = await googleVolume(book.id, book.title, book.authorNames?.[0] ?? null);

  let description: BookDescription | null = null;
  if (google?.description) description = { text: google.description, source: 'Google Books' };
  else if (openLibraryDescription)
    description = { text: openLibraryDescription, source: 'Open Library' };

  return {
    ...book,
    title: preferTurkishSpelling(book.title, google?.title),
    description,
    links: { ...book.links, googleBooks: google?.previewLink ?? null },
  };
}
