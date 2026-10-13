import type { BookDescription, BookDetail } from '../domain/content.js';
import { ProviderError } from '../lib/http.js';
import { logger } from '../lib/logger.js';
import { findTurkishVolume, type GoogleBookMatch } from '../providers/googlebooks/index.js';
import { getBookCore } from '../providers/openlibrary/index.js';
import { normalizeForMatch } from '../providers/openlibrary/mappers.js';
import { baseTitle, findBookArticle, type WikipediaArticle } from '../providers/wikipedia/index.js';

const TURKISH_LETTERS = /[çğıöşüÇĞİÖŞÜ]/g;

/** Bundan kısa Vikipedi açıklaması "yetersiz" sayılır; Google Books da denenir. */
export const SHORT_DESCRIPTION = 150;

/**
 * Open Library bazı Türkçe başlıkları aksansız kaydetmiş ("Ucurtma Avcisi"). Vikipedi madde adı
 * ya da Google Books başlığı aynı kelimelerse ve daha çok Türkçe harf içeriyorsa o kullanılır.
 */
export function preferTurkishSpelling(current: string, candidate: string | undefined): string {
  if (!candidate || normalizeForMatch(current) !== normalizeForMatch(candidate)) return current;
  const letters = (value: string) => value.match(TURKISH_LETTERS)?.length ?? 0;
  return letters(candidate) > letters(current) ? candidate : current;
}

/**
 * Açıklama önceliği: Türkçe Vikipedi → Google Books (Türkçe) → Open Library (çoğunlukla İngilizce).
 * Vikipedi metni kısaysa (tek cümlelik maddeler) ve Google Books'ta daha uzun Türkçe metin
 * varsa o seçilir.
 */
export function chooseDescription(sources: {
  wikipedia: WikipediaArticle | null;
  google: GoogleBookMatch | null;
  openLibrary: string | null;
}): BookDescription | null {
  const { wikipedia, google, openLibrary } = sources;
  const fromWikipedia: BookDescription | null = wikipedia
    ? { text: wikipedia.extract, source: 'Vikipedi', url: wikipedia.url }
    : null;
  const fromGoogle: BookDescription | null = google?.description
    ? { text: google.description, source: 'Google Books', url: google.previewLink }
    : null;

  if (fromWikipedia && fromWikipedia.text.length >= SHORT_DESCRIPTION) return fromWikipedia;
  if (fromGoogle && fromGoogle.text.length > (fromWikipedia?.text.length ?? 0)) return fromGoogle;
  if (fromWikipedia) return fromWikipedia;
  return openLibrary ? { text: openLibrary, source: 'Open Library', url: null } : null;
}

/** Yan kaynak hatası sayfayı düşürmez: loglanır ve sonuç yokmuş gibi devam edilir. */
async function optional<T>(task: Promise<T>, what: string): Promise<T | null> {
  try {
    return await task;
  } catch (error) {
    if (!(error instanceof ProviderError)) throw error;
    logger.warn({ provider: error.provider, kind: error.kind }, `${what} alınamadı`);
    return null;
  }
}

/**
 * Kitap detayı: temel veri Open Library'den, Türkçe açıklama Vikipedi'den (yoksa ya da
 * kısaysa Google Books'tan). Yan kaynaklardan biri çökerse sayfa yine açılır.
 */
export async function getBookDetail(id: string): Promise<BookDetail> {
  const { openLibraryDescription, ...book } = await getBookCore(id);
  // Kiril vb. yazılmış yazar adları aramada işe yaramaz; Latin harfli ilk ad kullanılır.
  const author = book.authorNames?.find((name) => normalizeForMatch(name)) ?? null;

  const wikipedia =
    (await optional(findBookArticle(book.id, book.title, author), 'Vikipedi açıklaması'))
      ?.article ?? null;
  // Google Books yavaş ve sık hata veriyor; sadece Vikipedi yetersizse sorulur.
  const google =
    !wikipedia || wikipedia.extract.length < SHORT_DESCRIPTION
      ? ((await optional(findTurkishVolume(book.id, book.title, author), 'Google Books açıklaması'))
          ?.volume ?? null)
      : null;

  return {
    ...book,
    title: preferTurkishSpelling(
      preferTurkishSpelling(book.title, wikipedia ? baseTitle(wikipedia.title) : undefined),
      google?.title,
    ),
    description: chooseDescription({ wikipedia, google, openLibrary: openLibraryDescription }),
    links: { ...book.links, googleBooks: google?.previewLink ?? null },
  };
}
