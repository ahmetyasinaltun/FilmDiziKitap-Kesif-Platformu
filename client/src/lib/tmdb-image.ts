const BASE = 'https://image.tmdb.org/t/p';

export type TmdbSize = 'w92' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280';

export function tmdbImage(path: string, size: TmdbSize): string {
  return `${BASE}/${size}${path}`;
}

/**
 * Afiş veya kapak için `<img>` kaynakları. TMDB'den yol gelir ("/abc.jpg"), kitap kapakları
 * Open Library'nin tam adresidir; boyutu "-M" / "-L" eki belirler.
 */
export function posterSources(poster: string) {
  if (poster.startsWith('/')) {
    return { src: tmdbImage(poster, 'w342'), srcSet: tmdbSrcSet(poster, ['w185', 'w342']) };
  }
  return {
    src: poster,
    srcSet: `${poster} 180w, ${poster.replace('-M.jpg', '-L.jpg')} 400w`,
  };
}

/** "w342 342w, w500 500w" biçiminde; tarayıcı ekrana uygun olanı seçer. */
export function tmdbSrcSet(path: string, sizes: TmdbSize[]): string {
  return sizes.map((size) => `${tmdbImage(path, size)} ${size.slice(1)}w`).join(', ');
}
