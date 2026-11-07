import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { BRAND_NAME } from '../lib/brand';
import { SearchIcon } from './icons';

const navLinkClass = (active: boolean) =>
  `flex h-11 items-center transition-colors duration-200 hover:text-light ${
    active ? 'text-light' : 'text-light-dim'
  }`;

/** Film ve dizi detayları da "Film ve Dizi" bölümüne aittir. */
const isTitleSection = (path: string) =>
  path === '/' || path.startsWith('/film/') || path.startsWith('/dizi/');

export function AppLayout() {
  const { pathname } = useLocation();
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
        <div className="perde-width page-gutter flex h-full items-center gap-3 min-[24rem]:gap-4 sm:gap-8">
          <Link
            to="/"
            translate="no"
            className="font-display text-2xl leading-none min-[24rem]:text-[1.75rem]"
          >
            {BRAND_NAME}
          </Link>
          <nav
            aria-label="Ana menü"
            className="flex gap-3 text-[0.9375rem] min-[24rem]:gap-4 min-[24rem]:text-base sm:gap-6 sm:text-[1.0625rem]"
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
            <Link
              to="/giris"
              className="flex h-11 items-center text-light-dim transition-colors duration-200 hover:text-light"
            >
              Giriş
            </Link>
          </div>
        </div>
      </header>

      <main id="icerik">
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-line">
        <div className="perde-width page-gutter py-8 text-sm leading-relaxed text-light-dim">
          <p className="max-w-[65ch]">
            Film ve dizi verileri TMDB'den, dış puanlar OMDb'den, nerede izlenir verisi
            JustWatch'tan, kitap verileri Open Library'den gelir. Bu ürün TMDB API'sini kullanır
            ancak TMDB tarafından onaylanmamış veya sertifikalandırılmamıştır.
          </p>
        </div>
      </footer>

      <ScrollRestoration />
    </>
  );
}
