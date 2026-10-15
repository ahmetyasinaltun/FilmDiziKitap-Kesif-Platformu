import type { MediaType } from '../domain/content.js';
import type { ContentCard, ContentRef } from '../domain/library.js';
import type { ContentSource, ContentType } from '../generated/prisma/enums.js';
import { ProviderError } from '../lib/http.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { getMovie, getTv } from '../providers/tmdb/index.js';
import { getBookDetail } from './books.js';

/**
 * Kullanıcı eylemleri (kütüphane, liste, yorum) bir içeriğe bağlanmak için yerel bir
 * `Content` kaydına ihtiyaç duyar. Bu kayıt sadece kartlarda göstermek için özet tutar;
 * detay sayfası verisini her zaman sağlayıcıdan alır (v1'deki "yarım kayıt" hatasının çözümü).
 */

const KEYS: Record<MediaType, { source: ContentSource; type: ContentType }> = {
  movie: { source: 'TMDB', type: 'MOVIE' },
  tv: { source: 'TMDB', type: 'TV' },
  book: { source: 'OPEN_LIBRARY', type: 'BOOK' },
};

const MEDIA_TYPES: Record<ContentType, MediaType> = { MOVIE: 'movie', TV: 'tv', BOOK: 'book' };

/**
 * Özet bundan eskiyse, içerik bir sonraki kullanıcı eyleminde sağlayıcıdan yenilenir.
 * Örnek: vizyona girmemiş bir film izleme listesine İngilizce adıyla eklenir, Türkçe adı
 * TMDB'ye sonradan girer.
 */
const REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** Prisma sorgularında içeriği sağlayıcı kimliğiyle bulmak için. */
export function contentWhere(ref: ContentRef) {
  return { ...KEYS[ref.type], externalId: ref.id };
}

export function toContentCard(row: {
  type: ContentType;
  externalId: string;
  title: string;
  year: number | null;
  posterPath: string | null;
  authorNames: string[];
}): ContentCard {
  const type = MEDIA_TYPES[row.type];
  return {
    type,
    id: row.externalId,
    title: row.title,
    year: row.year,
    poster: row.posterPath,
    ...(type === 'book' && { authorNames: row.authorNames }),
  };
}

/** Özet sağlayıcıdan (önbellek üzerinden) alınır; içerik yoksa ProviderError('not_found') → 404. */
async function fetchSummary(ref: ContentRef) {
  if (ref.type === 'book') return getBookDetail(ref.id);
  return ref.type === 'movie' ? getMovie(Number(ref.id)) : getTv(Number(ref.id));
}

/**
 * İçeriğin yerel kaydını döner; yoksa sağlayıcıda var olduğunu doğrulayıp oluşturur.
 * Kimlik istemciden geldiği için doğrulamasız kayıt açılmaz: uydurma bir kimlik 404 alır.
 */
export async function ensureContent(ref: ContentRef): Promise<{ id: string }> {
  const key = contentWhere(ref);
  const where = { source_type_externalId: key };
  const existing = await prisma.content.findUnique({
    where,
    select: { id: true, updatedAt: true },
  });
  if (existing && Date.now() - existing.updatedAt.getTime() < REFRESH_AFTER_MS) {
    return { id: existing.id };
  }

  let summary;
  try {
    summary = await fetchSummary(ref);
  } catch (error) {
    // Eski özet, kullanıcının eylemini engellemekten iyidir.
    if (existing && error instanceof ProviderError) {
      logger.warn({ provider: error.provider, kind: error.kind }, 'İçerik özeti yenilenemedi');
      return { id: existing.id };
    }
    throw error;
  }

  const data = {
    title: summary.title,
    posterPath: summary.poster,
    year: summary.year,
    authorNames: summary.authorNames ?? [],
  };
  return prisma.content.upsert({
    where,
    create: { ...key, ...data },
    update: data,
    select: { id: true },
  });
}
