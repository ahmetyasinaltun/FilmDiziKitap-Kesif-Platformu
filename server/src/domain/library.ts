import type { ContentSummary, MediaType } from './content.js';

/**
 * Kullanıcının bir içerikle ilişkisi. Tek durum listesi, arayüzde türe göre etiket:
 * planned = izleyeceğim / okuyacağım, completed = izledim / okudum.
 */
export const LIBRARY_STATUSES = ['planned', 'completed'] as const;
export type LibraryStatus = (typeof LIBRARY_STATUSES)[number];

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
  /** "İzledim / okudum"a geçiş */
  finishedAt: string | null;
  updatedAt: string;
}

export interface LibraryItem extends LibraryEntry {
  content: ContentCard;
}
