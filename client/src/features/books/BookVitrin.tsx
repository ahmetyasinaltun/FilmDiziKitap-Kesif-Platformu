import { useState } from 'react';
import { QueryError } from '../../components/QueryError';
import { FilmQueue, QueueSkeleton } from '../discover/FilmQueue';
import { BookStage, BookStageSkeleton } from './BookStage';
import { useBook, useTurkishLiterature } from './use-books';

const QUEUE_SIZE = 12;

/**
 * Bölümün ilk ekranı. Türk edebiyatı rafından kurulur: Türkçe başlık ve Vikipedi açıklaması bu
 * rafta en güçlü, haftanın trend listesi ise çoğunlukla İngilizce.
 */
export function BookVitrin() {
  const shelf = useTurkishLiterature();
  const [selectedId, setSelectedId] = useState<string>();

  const items = (shelf.data ?? []).filter((item) => item.poster).slice(0, QUEUE_SIZE);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const detail = useBook(selected?.id);

  if (shelf.isPending) {
    return (
      <BookStageSkeleton vitrin>
        <QueueSkeleton />
      </BookStageSkeleton>
    );
  }

  if (shelf.isError) {
    return (
      <div className="perde-width page-gutter py-16">
        <QueryError message={shelf.error.message} onRetry={() => void shelf.refetch()} />
      </div>
    );
  }

  if (!selected) {
    return (
      <p className="perde-width page-gutter py-16 text-light-dim">
        Şu an gösterilecek bir kitap bulunamadı.
      </p>
    );
  }

  return (
    <BookStage summary={selected} detail={detail.data} detailStatus={detail.status} linkToDetail>
      <FilmQueue
        items={items}
        label="Türk edebiyatından"
        selectedId={selected.id}
        onSelect={setSelectedId}
      />
    </BookStage>
  );
}
