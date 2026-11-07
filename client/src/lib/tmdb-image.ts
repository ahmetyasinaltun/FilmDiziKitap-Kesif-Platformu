const BASE = 'https://image.tmdb.org/t/p';

export type TmdbSize = 'w92' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280';

export function tmdbImage(path: string, size: TmdbSize): string {
  return `${BASE}/${size}${path}`;
}

/** "w342 342w, w500 500w" biçiminde; tarayıcı ekrana uygun olanı seçer. */
export function tmdbSrcSet(path: string, sizes: TmdbSize[]): string {
  return sizes.map((size) => `${tmdbImage(path, size)} ${size.slice(1)}w`).join(', ');
}
