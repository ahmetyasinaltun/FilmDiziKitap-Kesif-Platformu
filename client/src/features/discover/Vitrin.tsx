import { useState } from 'react';
import { QueryError } from '../../components/QueryError';
import { Stage, StageSkeleton } from '../titles/Stage';
import { useTitle } from '../titles/use-title';
import { FilmQueue } from './FilmQueue';
import { useNowPlaying, useTrending } from './use-discover';

const QUEUE_SIZE = 12;

/** Ana sayfanın ilk ekranı: haftanın öne çıkanları perdede, seçim alttaki sırayla değişir. */
export function Vitrin() {
  const trending = useTrending();
  const nowPlaying = useNowPlaying();
  const [selectedId, setSelectedId] = useState<string>();

  // Haftanın trendlerinden en yüksek puanlılar: vitrin "ne izlesem?" sorusuna iyi bir cevapla açılsın.
  const items = (trending.data ?? [])
    .filter((item) => item.backdrop)
    .toSorted((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, QUEUE_SIZE);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const detail = useTitle(selected?.type, selected?.id);

  if (trending.isPending) return <StageSkeleton />;

  if (trending.isError) {
    return (
      <div className="perde-width page-gutter py-16">
        <QueryError message={trending.error.message} onRetry={() => void trending.refetch()} />
      </div>
    );
  }

  if (!selected) {
    return (
      <p className="perde-width page-gutter py-16 text-light-dim">
        Bu hafta gösterilecek bir yapım bulunamadı.
      </p>
    );
  }

  const inTheaters = nowPlaying.data?.some((item) => item.id === selected.id) ?? false;

  return (
    <Stage
      summary={selected}
      detail={detail.data}
      detailStatus={detail.status}
      inTheaters={inTheaters}
      linkToDetail
    >
      <FilmQueue
        items={items}
        label="Bu hafta öne çıkanlar"
        selectedId={selected.id}
        onSelect={setSelectedId}
      />
    </Stage>
  );
}
