import type { TitleDetail, WatchProviders } from '../../lib/content';
import { formatRating } from '../../lib/format';

/** Altyazıda en fazla bu kadar platform yazılır; tamamı detay sayfasında. */
const MAX_PROVIDERS = 3;

const providerList = (names: string[]) => {
  const shown = names.slice(0, MAX_PROVIDERS).join(', ');
  const rest = names.length - MAX_PROVIDERS;
  return rest > 0 ? `${shown} ve ${rest} platform daha` : shown;
};

const names = (list: { name: string }[]) => list.map((provider) => provider.name);

/** "IMDb 8,5 · Rotten Tomatoes %99 · Metacritic 97". Olmayan puan yazılmaz, uydurulmaz. */
export function scoreLine(title: Pick<TitleDetail, 'externalRatings' | 'rating'>): string | null {
  const external = title.externalRatings;
  const scores = [
    external?.imdb ? `IMDb ${formatRating(external.imdb.rating)}` : null,
    external?.rottenTomatoes != null ? `Rotten Tomatoes %${external.rottenTomatoes}` : null,
    external?.metacritic != null ? `Metacritic ${external.metacritic}` : null,
  ].filter((score) => score !== null);

  if (scores.length > 0) return scores.join(' · ');
  return title.rating != null ? `TMDB ${formatRating(title.rating)}` : null;
}

/**
 * "Nerede?" sorusunun tek satırlık cevabı. Yer adlarına ek gelmesin diye ("Max'te", "TV+'da")
 * iki nokta kalıbı kullanılıyor: platform adları dinamik, Türkçe ek uyumu otomatik kurulamaz.
 */
export function whereLine(watch: WatchProviders | null, inTheaters: boolean): string {
  const included = watch ? [...watch.stream, ...watch.free] : [];
  if (included.length > 0) return `Türkiye'de: ${providerList(names(included))}`;
  if (inTheaters) return "Türkiye'de sinemalarda";
  if (watch && watch.rent.length > 0) return `Kiralık: ${providerList(names(watch.rent))}`;
  if (watch && watch.buy.length > 0) return `Satın alınabilir: ${providerList(names(watch.buy))}`;
  return "Türkiye'de platform bilgisi yok";
}

/** "2019 · 133 dk · 16+ · Komedi, Gerilim, Dram" */
export function metaLine(title: TitleDetail): string {
  const length =
    title.type === 'movie'
      ? title.runtime
        ? `${title.runtime}\u00A0dk`
        : null
      : `${title.seasonCount}\u00A0sezon`;
  const genres = title.genres
    .slice(0, 3)
    .map((genre) => genre.name)
    .join(', ');

  return [title.year, length, title.certification, genres || null]
    .filter((part) => part !== null && part !== undefined)
    .join(' · ');
}
