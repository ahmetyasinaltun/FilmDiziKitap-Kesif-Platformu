import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { BRAND_NAME } from '../lib/brand';
import { SearchIcon } from './icons';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex h-11 items-center transition-colors duration-200 hover:text-light ${
    isActive ? 'text-light' : 'text-light-dim'
  }`;

export function AppLayout() {
  return (
    <>
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-40 focus:bg-light focus:px-4 focus:py-2 focus:text-room"
      >
        İçeriğe geç
      </a>

      <header className="relative z-10 h-[var(--header-h)]">
        <div className="perde-width page-gutter flex h-full items-center gap-4 sm:gap-8">
          <Link to="/" translate="no" className="font-display text-[1.75rem] leading-none">
            {BRAND_NAME}
          </Link>
          <nav aria-label="Ana menü" className="flex gap-4 sm:gap-6 sm:text-[1.0625rem]">
            <NavLink to="/" end className={navLinkClass}>
              Film ve Dizi
            </NavLink>
            <NavLink to="/kitap" className={navLinkClass}>
              Kitap
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-4 sm:text-[1.0625rem]">
            <Link
              to="/arama"
              aria-label="Ara"
              className="grid size-11 place-items-center text-light-dim transition-colors duration-200 hover:text-light"
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
            Film ve dizi verileri TMDB'den, nerede izlenir verisi JustWatch'tan gelir. Bu ürün TMDB
            API'sini kullanır ancak TMDB tarafından onaylanmamış veya sertifikalandırılmamıştır.
          </p>
        </div>
      </footer>

      <ScrollRestoration />
    </>
  );
}
