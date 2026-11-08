/**
 * API'nin dışarıya verdiği normalize içerik tipleri. Hangi sağlayıcıdan gelirse gelsin
 * arayüz bu biçimi görür. Kararların gerekçesi: LEARNING.md ("İçerik katmanı").
 *
 * Görsel alanları (`poster`, `backdrop`, `profile`, `logo`): TMDB görselleri "/abc.jpg"
 * biçiminde yol olarak gelir, boyutu istemci ekrana göre seçer (w342, w780...).
 * Kitap görselleri tam URL'dir (Open Library: ".../b/id/123-M.jpg"; boyut için "-S/-M/-L"
 * eki değiştirilebilir). Ayırt etmek için: "/" ile başlıyorsa TMDB yolu.
 */

export type MediaType = 'movie' | 'tv' | 'book';

/** Kart ve listelerde gösterim için özet. */
export interface ContentSummary {
  type: MediaType;
  /** Sağlayıcıdaki kimlik: TMDB id'si ("27205") veya Open Library eser kimliği ("OL1168083W") */
  id: string;
  /** Kitaplarda Türkçe baskının adı (varsa) */
  title: string;
  /** Sadece başlıktan farklıysa dolu (kitaplarda eserin özgün adı, örn. "Nineteen Eighty-Four") */
  originalTitle: string | null;
  /** Kitaplarda ilk yayın yılı */
  year: number | null;
  poster: string | null;
  /** Arama sonuçlarında dolu; öneri ve filmografi listelerinde yer kazanmak için boş */
  overview: string | null;
  /** Kaynağın kendi puanı (0-10), yeterli oy yoksa null */
  rating: number | null;
  /** Sadece kitaplarda: yazar adları (kartta yıl yerine yazar gösterilir) */
  authorNames?: string[];
  /** Sadece trend, vizyon ve arama listelerinde: vitrin, sahne kartı ve en iyi sonuç için */
  backdrop?: string | null;
}

export interface PersonSummary {
  type: 'person';
  id: string;
  name: string;
  profile: string | null;
  /** TMDB departman kodu: "Acting", "Directing", "Writing"... Etiketi istemci çevirir. */
  department: string | null;
}

export type SearchResult = ContentSummary | PersonSummary;

export interface Paginated<T> {
  page: number;
  totalPages: number;
  totalResults: number;
  results: T[];
}

export interface Genre {
  id: number;
  name: string;
}

/** Sadece YouTube videoları; `key` ile https://www.youtube.com/watch?v={key} */
export interface Video {
  key: string;
  name: string;
  /** ISO 639-1 dil kodu ("tr", "en") */
  language: string | null;
}

export interface CastMember {
  id: string;
  name: string;
  character: string | null;
  profile: string | null;
  /** Sadece dizilerde: oyuncunun yer aldığı bölüm sayısı */
  episodeCount?: number;
}

export interface CrewMember {
  id: string;
  name: string;
  /** TMDB görev kodu: "Director", "Screenplay", "Novel"... Etiketi istemci çevirir. */
  job: string;
}

export interface WatchProvider {
  id: number;
  name: string;
  logo: string | null;
}

/** Türkiye'de nerede izlenir. Veri JustWatch'tan (TMDB üzerinden); atıf zorunlu. */
export interface WatchProviders {
  /** TMDB'nin izleme sayfası (JustWatch bağlantıları burada) */
  link: string | null;
  /** Abonelikle (Netflix vb.) */
  stream: WatchProvider[];
  /** Ücretsiz veya reklamlı */
  free: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

/** OMDb'den gelen dış puanlar. Kaynakta olmayan puan null. */
export interface ExternalRatings {
  imdb: { rating: number; votes: number | null } | null;
  /** Yüzde (0-100) */
  rottenTomatoes: number | null;
  /** 0-100 */
  metacritic: number | null;
}

interface TitleDetailBase extends ContentSummary {
  tagline: string | null;
  backdrop: string | null;
  genres: Genre[];
  voteCount: number;
  imdbId: string | null;
  /** Türkiye yaş sınırı ("13+", "18+"), yoksa null */
  certification: string | null;
  trailer: Video | null;
  cast: CastMember[];
  recommendations: ContentSummary[];
  /** Türkiye'de hiçbir platformda yoksa null */
  watchProviders: WatchProviders | null;
  /** Dış puan kaynağı o an erişilemezse null; sayfa yine açılır */
  externalRatings: ExternalRatings | null;
}

export interface MovieDetail extends TitleDetailBase {
  type: 'movie';
  releaseDate: string | null;
  /** Dakika */
  runtime: number | null;
  directors: CrewMember[];
  writers: CrewMember[];
  collection: { id: string; name: string } | null;
}

export interface SeasonSummary {
  number: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
  poster: string | null;
}

export interface EpisodeSummary {
  season: number;
  number: number;
  name: string;
  airDate: string | null;
}

export interface TvDetail extends TitleDetailBase {
  type: 'tv';
  firstAirDate: string | null;
  lastAirDate: string | null;
  /** TMDB durum kodu: "Returning Series", "Ended", "Canceled"... */
  status: string | null;
  inProduction: boolean;
  seasonCount: number;
  episodeCount: number;
  /** Ortalama bölüm süresi (dakika) */
  episodeRuntime: number | null;
  creators: CrewMember[];
  networks: { id: number; name: string; logo: string | null }[];
  /** Özel bölümler (0. sezon) sona alınır */
  seasons: SeasonSummary[];
  nextEpisode: EpisodeSummary | null;
}

export interface Episode {
  number: number;
  name: string;
  overview: string | null;
  airDate: string | null;
  /** Dakika */
  runtime: number | null;
  still: string | null;
  rating: number | null;
}

export interface SeasonDetail {
  showId: string;
  number: number;
  name: string;
  overview: string | null;
  airDate: string | null;
  poster: string | null;
  episodes: Episode[];
}

export interface PersonRole {
  /** Oyuncuda karakter adı ("Bruce Wayne"), ekipte TMDB görev kodu ("Director") */
  name: string;
  /**
   * Ekipte TMDB departmanı ("Camera"), oyuncuda null. TMDB'de 900'den fazla görev var; arayüz
   * çevirisini bilmediği görevde departmanın Türkçesini gösterir.
   */
  department: string | null;
}

export interface PersonCredit {
  content: ContentSummary;
  roles: PersonRole[];
}

export interface PersonDetail {
  type: 'person';
  id: string;
  name: string;
  biography: string | null;
  birthday: string | null;
  deathday: string | null;
  placeOfBirth: string | null;
  profile: string | null;
  department: string | null;
  imdbId: string | null;
  /** En bilinen işleri (oy sayısına göre ilk 8) */
  knownFor: ContentSummary[];
  /** Tüm işleri, yeniden eskiye. Talk show ve haber programları hariç. */
  credits: PersonCredit[];
}

// ---------- Kitaplar (Open Library + Google Books) ----------

export interface BookDescription {
  text: string;
  /**
   * Atıf ve dil ipucu için. Vikipedi ve Google Books Türkçe, Open Library çoğunlukla İngilizce.
   * Vikipedi metni CC BY-SA 4.0: arayüzde kaynak adı ve `url` bağlantısı gösterilmeli.
   */
  source: 'Vikipedi' | 'Google Books' | 'Open Library';
  url: string | null;
}

export interface BookDetail extends ContentSummary {
  type: 'book';
  authors: { id: string; name: string }[];
  /** Önce Türkçe Vikipedi, sonra Google Books, en son Open Library; hiçbiri yoksa null */
  description: BookDescription | null;
  /** Türkçe baskının sayfa sayısı, yoksa baskıların ortancası */
  pageCount: number | null;
  /** Türkçe baskının yayınevi */
  publisher: string | null;
  isbn: string | null;
  editionCount: number;
  links: {
    openLibrary: string;
    /** Google Books önizleme sayfası (varsa) */
    googleBooks: string | null;
  };
}

export interface AuthorDetail {
  type: 'author';
  /** Open Library yazar kimliği ("OL15318546A") */
  id: string;
  name: string;
  /** Çoğunlukla İngilizce; Türk yazarların çoğunda yok */
  bio: string | null;
  birthDate: string | null;
  deathDate: string | null;
  photo: string | null;
  /** Baskı sayısına göre en çok basılan eserleri; Türkçe baskısı varsa Türkçe adıyla */
  works: ContentSummary[];
}

/** "Tümü" araması: kaynaklar ayrı bölümlerde, biri çökerse diğeri yine gelir. */
export type SearchSection<T> =
  { status: 'ok'; data: Paginated<T> } | { status: 'unavailable'; message: string };

export interface CombinedSearch {
  /** Film, dizi ve kişiler (TMDB) */
  titles: SearchSection<SearchResult>;
  /** Kitaplar (Open Library) */
  books: SearchSection<ContentSummary>;
}
