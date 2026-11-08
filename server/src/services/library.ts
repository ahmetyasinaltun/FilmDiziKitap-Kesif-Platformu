import type { MediaType, Paginated } from '../domain/content.js';
import type { ContentRef, LibraryEntry, LibraryItem, LibraryStatus } from '../domain/library.js';
import type { LibraryStatus as DbStatus } from '../generated/prisma/enums.js';
import { AppError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { contentWhere, ensureContent, toContentCard } from './content-records.js';

/** 2, 3, 4 ve 6 sütunlu ızgaraya tam bölünür. */
const LIBRARY_PAGE_SIZE = 24;

const toDbStatus = (status: LibraryStatus) => status.toUpperCase() as DbStatus;
const fromDbStatus = (status: DbStatus) => status.toLowerCase() as LibraryStatus;

interface EntryRow {
  status: DbStatus;
  rating: number | null;
  finishedAt: Date | null;
  updatedAt: Date;
}

function toEntry(row: EntryRow): LibraryEntry {
  return {
    status: fromDbStatus(row.status),
    rating: row.rating,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface EntryInput {
  status: LibraryStatus;
  /** Verilmezse mevcut puan korunur; `null` puanı siler. */
  rating?: number | null;
}

/**
 * Durum değişikliğinin yan etkileri tek yerde:
 * - "izleyeceğim"e dönen içeriğin puanı ve bitiş tarihi silinir (izlenmemiş bir şeyin puanı olmaz)
 * - "izledim"e geçişte bitiş tarihi yazılır; zaten izlenmişse tarih ve puan korunur
 */
function nextEntryState(existing: EntryRow | null, input: EntryInput, now: Date) {
  const status = toDbStatus(input.status);
  if (status === 'PLANNED') return { status, rating: null, finishedAt: null };
  return {
    status,
    rating: input.rating !== undefined ? input.rating : (existing?.rating ?? null),
    finishedAt: existing?.status === 'COMPLETED' ? existing.finishedAt : now,
  };
}

/** Kullanıcının bu içerikle ilişkisi; kütüphanesinde değilse `null`. */
export async function getEntry(userId: string, ref: ContentRef): Promise<LibraryEntry | null> {
  const row = await prisma.libraryEntry.findFirst({
    where: { userId, content: contentWhere(ref) },
  });
  return row ? toEntry(row) : null;
}

/** Kütüphaneye ekler ya da durumunu/puanını günceller (aynı istek iki kez gelse de sonuç aynı). */
export async function saveEntry(
  userId: string,
  ref: ContentRef,
  input: EntryInput,
): Promise<LibraryEntry> {
  const content = await ensureContent(ref);
  const where = { userId_contentId: { userId, contentId: content.id } };
  const existing = await prisma.libraryEntry.findUnique({ where });
  const data = nextEntryState(existing, input, new Date());
  const row = await prisma.libraryEntry.upsert({
    where,
    create: { userId, contentId: content.id, ...data },
    update: data,
  });
  return toEntry(row);
}

/** Kütüphaneden çıkarır. Zaten yoksa da sorun değil. */
export async function removeEntry(userId: string, ref: ContentRef): Promise<void> {
  await prisma.libraryEntry.deleteMany({ where: { userId, content: contentWhere(ref) } });
}

export interface LibraryFilter {
  type?: MediaType;
  status?: LibraryStatus;
  page: number;
}

const DB_TYPES = { movie: 'MOVIE', tv: 'TV', book: 'BOOK' } as const;

/** Bir kullanıcının kütüphanesi (herkese açık), son güncellenen önce. */
export async function listLibrary(
  username: string,
  { type, status, page }: LibraryFilter,
): Promise<Paginated<LibraryItem>> {
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Böyle bir kullanıcı yok.');

  const where = {
    userId: user.id,
    ...(status && { status: toDbStatus(status) }),
    ...(type && { content: { type: DB_TYPES[type] } }),
  };
  const [total, rows] = await Promise.all([
    prisma.libraryEntry.count({ where }),
    prisma.libraryEntry.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * LIBRARY_PAGE_SIZE,
      take: LIBRARY_PAGE_SIZE,
      include: { content: true },
    }),
  ]);

  return {
    page,
    totalPages: Math.ceil(total / LIBRARY_PAGE_SIZE),
    totalResults: total,
    results: rows.map((row) => ({ ...toEntry(row), content: toContentCard(row.content) })),
  };
}
