import type { CastMember, TitleDetail, WatchProvider, WatchProviders } from '../../lib/content';
import { formatCount, formatRating } from '../../lib/format';
import { tmdbImage } from '../../lib/tmdb-image';

const CAST_LIMIT = 12;

/** Altyazıdaki puanların ayrıntısı: oy sayıları burada. Olmayan puan gizlenmez, "yok" yazılır. */
export function Scores({ title }: { title: TitleDetail }) {
  const external = title.externalRatings;
  const scores = [
    {
      label: 'IMDb',
      value: external?.imdb ? formatRating(external.imdb.rating) : null,
      note: external?.imdb?.votes ? `${formatCount(external.imdb.votes)} oy` : null,
    },
    {
      label: 'Rotten Tomatoes',
      value: external?.rottenTomatoes != null ? `%${external.rottenTomatoes}` : null,
    },
    {
      label: 'Metacritic',
      value: external?.metacritic != null ? String(external.metacritic) : null,
    },
    {
      label: 'TMDB',
      value: title.rating != null ? formatRating(title.rating) : null,
      note: title.voteCount > 0 ? `${formatCount(title.voteCount)} oy` : null,
    },
  ];

  return (
    <section aria-labelledby="puanlar">
      <h2 id="puanlar" className="font-display text-[1.75rem] leading-tight">
        Puanlar
      </h2>
      <dl className="mt-3 divide-y divide-line">
        {scores.map(({ label, value, note }) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-light-dim">{label}</dt>
            <dd className="tabular-nums">
              {note && <span className="mr-3 text-sm text-light-dim">{note}</span>}
              {value ? (
                <span className="font-bold">{value}</span>
              ) : (
                <span className="text-light-dim">Puan yok</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ProviderGroup({ label, providers }: { label: string; providers: WatchProvider[] }) {
  if (providers.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm text-light-dim">{label}</h3>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-3">
        {providers.map((provider) => (
          <li key={provider.id} className="flex items-center gap-2 font-medium">
            {provider.logo && (
              <img
                src={tmdbImage(provider.logo, 'w92')}
                alt=""
                width={36}
                height={36}
                loading="lazy"
                decoding="async"
                className="size-9"
              />
            )}
            {provider.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WhereToWatch({
  watch,
  inTheaters,
}: {
  watch: WatchProviders | null;
  inTheaters: boolean;
}) {
  return (
    <section aria-labelledby="nerede-izlenir">
      <h2 id="nerede-izlenir" className="font-display text-[1.75rem] leading-tight">
        Nerede izlenir
      </h2>
      <div className="mt-4 space-y-4">
        {inTheaters && <p className="font-medium">Türkiye'de sinemalarda</p>}
        {watch ? (
          <>
            <ProviderGroup label="Abonelikle" providers={watch.stream} />
            <ProviderGroup label="Ücretsiz" providers={watch.free} />
            <ProviderGroup label="Kiralık" providers={watch.rent} />
            <ProviderGroup label="Satın al" providers={watch.buy} />
            <p className="text-sm text-light-dim">
              Veri:{' '}
              <a
                href={watch.link ?? 'https://www.justwatch.com/tr'}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-light"
              >
                JustWatch
              </a>
            </p>
          </>
        ) : (
          !inTheaters && <p className="text-light-dim">Türkiye'de platform bilgisi yok.</p>
        )}
      </div>
    </section>
  );
}

export function CastRow({ cast }: { cast: CastMember[] }) {
  if (cast.length === 0) return null;

  return (
    <section aria-labelledby="oyuncular">
      <h2 id="oyuncular" className="font-display text-[1.75rem] leading-tight">
        Oyuncular
      </h2>
      <ul className="row-scroll -mx-4 mt-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 sm:mx-0 sm:px-0 sm:gap-5">
        {cast.slice(0, CAST_LIMIT).map((person) => (
          <li key={person.id} className="w-28 shrink-0 snap-start">
            <div className="aspect-[2/3] overflow-hidden bg-room-raised">
              {person.profile && (
                <img
                  src={tmdbImage(person.profile, 'w185')}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              )}
            </div>
            <p className="mt-2 text-sm font-medium leading-snug">{person.name}</p>
            {person.character && (
              <p className="text-sm leading-snug text-light-dim">{person.character}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
