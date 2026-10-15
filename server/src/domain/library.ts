import type { ContentSummary, MediaType } from './content.js';

/**
 * Kullanıcının bir içerikle ilişkisi. Tek durum listesi, arayüzde türe göre etiket:
 * planned = izleyeceğim / okuyacağım, in_progress = izliyorum / okuyorum,
 * completed = izledim / okudum, dropped = bıraktım.
 */
export const LIBRARY_STATUSES = ['planned', 'in_progress', 'completed', 'dropped'] as const;
export type LibraryStatus = (typeof LIBRARY_STATUSES)[number];

/**
 * Türe göre geçerli durumlar. Film tek oturuşta izlenir: "izliyorum" ve "bıraktım" bir
 * dizi ya da kitap için anlamlı, film için değil (Letterboxd'daki gibi).
 */
export const STATUSES_BY_TYPE = {
  movie: ['planned', 'completed'],
  tv: LIBRARY_STATUSES,
  book: LIBRARY_STATUSES,
} as const satisfies Record<MediaType, readonly LibraryStatus[]>;

/** Bir içeriği sağlayıcıdaki kimliğiyle gösterir: { type: 'movie', id: '27205' } */
export interface ContentRef {
  type: MediaType;
  id: string;
}

/** Kütüphane ve listelerde gösterilen özet (veritabanındaki kayıttan, sağlayıcıya gitmeden). */
export type ContentCard = Pick<
  ContentSummary,
  'type' | 'id' | 'title' | 'year' | 'poster' | 'authorNames'
>;

export interface LibraryEntry {
  status: LibraryStatus;
  /** 1-10 (arayüzde yarım adımlı 5 yıldız) */
  rating: number | null;
  /** "İzliyorum / okuyorum"a ilk geçiş */
  startedAt: string | null;
  /** "İzledim / okudum"a geçiş */
  finishedAt: string | null;
  updatedAt: string;
}

export interface LibraryItem extends LibraryEntry {
  content: ContentCard;
}
