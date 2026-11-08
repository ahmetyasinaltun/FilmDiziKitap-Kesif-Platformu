import { useSearchParams } from 'react-router';
import type { LibraryStatus, MediaType } from '../../lib/content';
import { useLibraryList } from './use-library';

export const TYPE_FILTERS: { param: string | null; label: string; value?: MediaType }[] = [
  { param: null, label: 'Tümü' },
  { param: 'film', label: 'Film', value: 'movie' },
  { param: 'dizi', label: 'Dizi', value: 'tv' },
  { param: 'kitap', label: 'Kitap', value: 'book' },
];

export const STATUS_FILTERS: { param: string | null; label: string; value?: LibraryStatus }[] = [
  { param: null, label: 'Hepsi' },
  { param: 'sirada', label: 'Sırada', value: 'planned' },
  { param: 'bitti', label: 'Bitti', value: 'completed' },
];

/**
 * Adresteki süzgeçlerle (`?tur=film&durum=bitti`) bir kullanıcının kütüphanesi. Raf ve profil
 * sayfası aynı sorguyu okur; sorgu anahtarı aynı olduğu için tek istek gider.
 */
export function useShelfList(username: string) {
  const [params] = useSearchParams();
  const type = TYPE_FILTERS.find((filter) => filter.param === params.get('tur'))?.value;
  const status = STATUS_FILTERS.find((filter) => filter.param === params.get('durum'))?.value;
  return {
    list: useLibraryList(username, { type, status }),
    filtered: type !== undefined || status !== undefined,
  };
}
