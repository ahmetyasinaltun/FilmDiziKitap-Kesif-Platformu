import type { ReactNode } from 'react';
import { BRAND_NAME, pageTitle } from '../lib/brand';

const linkClass = 'underline underline-offset-4 hover:text-light';

const SOURCES: { name: string; href: string; text: ReactNode }[] = [
  {
    name: 'JustWatch',
    href: 'https://www.justwatch.com/tr',
    text: "Türkiye'de nerede izlenir verisi (TMDB üzerinden).",
  },
  {
    name: 'OMDb',
    href: 'https://www.omdbapi.com',
    text: 'IMDb, Rotten Tomatoes ve Metacritic puanları.',
  },
  {
    name: 'Open Library',
    href: 'https://openlibrary.org',
    text: 'Kitap ve yazar bilgileri, kapaklar ve yazar fotoğrafları.',
  },
  {
    name: 'Vikipedi',
    href: 'https://tr.wikipedia.org',
    // Lisans, adıyla birlikte lisans metnine bağlantı da istiyor.
    text: (
      <>
        Türkçe kitap açıklamaları. Metinler{' '}
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/deed.tr"
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          CC BY-SA 4.0
        </a>{' '}
        lisanslıdır; her açıklamanın yanında maddesine bağlantı verilir.
      </>
    ),
  },
  {
    name: 'Wikidata',
    href: 'https://www.wikidata.org',
    text: 'Kitapları Vikipedi maddeleriyle eşleştirmek için.',
  },
  {
    name: 'Google Books',
    href: 'https://books.google.com',
    text: 'Bazı kitaplarda Türkçe açıklama ve önizleme bağlantısı.',
  },
];

export function AboutPage() {
  return (
    <div className="perde-width page-gutter pt-4 sm:pt-8">
      <title>{pageTitle('Hakkında')}</title>
      <div className="max-w-[65ch]">
        <h1 className="font-display text-[2.5rem] leading-tight sm:text-[3.5rem]">Hakkında</h1>
        <p className="mt-4 text-lg leading-relaxed">
          <span translate="no">{BRAND_NAME}</span>, film, dizi ve kitapları tek yerde bulup izleyip
          izlememeye ya da okuyup okumamaya hızlıca karar vermek için yapılmış, ticari olmayan bir
          portfolyo projesidir.
        </p>

        <h2 className="mt-12 font-display text-[1.75rem] leading-tight">Veri kaynakları</h2>

        {/* TMDB atfı: "Hakkında" bölümünde olmalı, logo sitenin kendi adından az belirgin. */}
        <section aria-labelledby="tmdb" className="mt-6 border-t border-line pt-6">
          <h3 id="tmdb" className="sr-only">
            TMDB
          </h3>
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center"
          >
            <img
              src="/tmdb-logo.svg"
              alt="TMDB"
              width={137}
              height={18}
              className="h-[18px] w-auto"
            />
          </a>
          <p className="mt-3 leading-relaxed">
            Film ve dizi bilgileri, afişler, oyuncular, fragmanlar ve öneriler TMDB'den gelir.
          </p>
          <p lang="en" className="mt-2 text-light-dim">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
          <p className="mt-1 text-light-dim">
            Bu ürün TMDB API'sini kullanır ancak TMDB tarafından onaylanmamış veya
            sertifikalandırılmamıştır.
          </p>
        </section>

        <ul className="mt-6 divide-y divide-line border-t border-line">
          {SOURCES.map((source) => (
            <li key={source.name} className="py-4">
              <a
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className={`font-medium ${linkClass}`}
              >
                {source.name}
              </a>
              <p className="mt-1 text-light-dim">{source.text}</p>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 font-display text-[1.75rem] leading-tight">Yazı tipleri</h2>
        <p className="mt-3 text-light-dim">
          Gloock ve Hanken Grotesk, SIL Open Font License ile kullanılmaktadır.
        </p>
      </div>
    </div>
  );
}
