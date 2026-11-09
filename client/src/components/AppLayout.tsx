import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { BRAND_NAME } from '../lib/brand';
import { useSession } from '../features/auth/use-auth';
import { BookmarkIcon, SearchIcon } from './icons';

const navLinkClass = (active: boolean) =>
  `flex h-11 items-center whitespace-nowrap transition-colors duration-200 hover:text-light ${
    active ? 'text-light' : 'text-light-dim'
  }`;

/** Film ve dizi detayları da "Film ve Dizi" bölümüne aittir. */
/** Marka adının son kelimesi dar ekranda alt satıra iner: "Film Dizi" / "Kitap". */
const brandWords = BRAND_NAME.split(' ');
const brandLead = brandWords.slice(0, -1).join(' ');
const brandLast = brandWords.at(-1);

const isTitleSection = (path: string) =>
  path === '/' || path.startsWith('/film/') || path.startsWith('/dizi/');

export function AppLayout() {
  const { pathname, search } = useLocation();
  const { user } = useSession();
  const inTitles = isTitleSection(pathname);
  const inBooks = pathname === '/kitap' || pathname.startsWith('/kitap/');

  return (
    <>
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-40 focus:bg-light focus:px-4 focus:py-2 focus:text-room"
      >
        İçeriğe geç
      </a>

      <header className="relative z-10 h-[var(--header-h)]">
        <div className="perde-width page-gutter flex h-full items-center gap-2 min-[24rem]:gap-4 sm:gap-8">
          <Link
            to="/"
            translate="no"
            className="font-display text-lg leading-[0.95] min-[24rem]:text-[1.375rem] sm:text-[1.75rem] sm:leading-none"
          >
            <span className="block sm:inline">{brandLead}</span>{' '}
            <span className="block sm:inline">{brandLast}</span>
          </Link>
          <nav
            aria-label="Ana menü"
            className="flex gap-2 text-sm min-[24rem]:gap-4 min-[24rem]:text-base sm:gap-6 sm:text-[1.0625rem]"
          >
            <Link
              to="/"
              aria-current={inTitles ? 'true' : undefined}
              className={navLinkClass(inTitles)}
            >
              Film ve Dizi
            </Link>
            <Link
              to="/kitap"
              aria-current={inBooks ? 'true' : undefined}
              className={navLinkClass(inBooks)}
            >
              Kitap
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1 text-[0.9375rem] min-[24rem]:gap-2 min-[24rem]:text-base sm:gap-4 sm:text-[1.0625rem]">
            <Link
              to="/arama"
              aria-label="Ara"
              aria-current={pathname === '/arama' ? 'page' : undefined}
              className={`grid size-11 place-items-center transition-colors duration-200 hover:text-light ${
                pathname === '/arama' ? 'text-light' : 'text-light-dim'
              }`}
            >
              <SearchIcon />
            </Link>
            {user ? (
              <Link
                to="/kutuphane"
                aria-label="Kütüphanem"
                aria-current={pathname === '/kutuphane' ? 'page' : undefined}
                className={`flex h-11 items-center justify-center transition-colors duration-200 hover:text-light max-sm:w-11 ${
                  pathname === '/kutuphane' ? 'text-light' : 'text-light-dim'
                }`}
              >
                <span className="sm:hidden">
                  <BookmarkIcon />
                </span>
                <span className="max-sm:hidden">Kütüphanem</span>
              </Link>
            ) : (
              <Link
                to={`/giris?next=${encodeURIComponent(pathname + search)}`}
                className="flex h-11 items-center text-light-dim transition-colors duration-200 hover:text-light"
              >
                Giriş
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* En az bir ekran boyu: veri yüklenirken alt bilgi ilk ekranda görünüp sonra aşağı itilmesin
          (yerleşim kayması; detay sayfalarında CLS 0,26'ydı). */}
      <main id="icerik" className="min-h-svh">
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-line">
        <div className="perde-width page-gutter flex flex-col gap-4 py-8 text-sm leading-relaxed text-light-dim sm:flex-row sm:justify-between">
          <p className="max-w-[65ch]">
            Film ve dizi verileri TMDB'den, dış puanlar OMDb'den, nerede izlenir verisi
            JustWatch'tan, kitap verileri Open Library'den gelir. Bu ürün TMDB API'sini kullanır
            ancak TMDB tarafından onaylanmamış veya sertifikalandırılmamıştır.
          </p>
          <Link
            to="/hakkinda"
            className="inline-flex min-h-11 shrink-0 items-center self-start underline underline-offset-4 hover:text-light sm:-mt-2.5"
          >
            Hakkında ve kaynaklar
          </Link>
        </div>
      </footer>

      <ScrollRestoration />
    </>
  );
}
