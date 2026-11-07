import { QueryPosterRow } from '../components/PosterRow';
import { useNowPlaying, usePopularTv } from '../features/discover/use-discover';
import { Vitrin } from '../features/discover/Vitrin';
import { BRAND_NAME, pageTitle } from '../lib/brand';

const ROW_SIZE = 6;

export function HomePage() {
  const nowPlaying = useNowPlaying();
  const popularTv = usePopularTv();

  return (
    <>
      <title>{pageTitle()}</title>
      <h1 className="sr-only">{BRAND_NAME}: bugün ne izlesem?</h1>
      <Vitrin />
      <div className="perde-width page-gutter mt-16 space-y-14">
        <QueryPosterRow title="Vizyonda" query={nowPlaying} limit={ROW_SIZE} />
        <QueryPosterRow title="Popüler diziler" query={popularTv} limit={ROW_SIZE} />
      </div>
    </>
  );
}
