import { useRef } from 'react';
import { Link } from 'react-router';
import { titlePath, type TitleSummary } from '../../lib/content';
import { tmdbImage, tmdbSrcSet } from '../../lib/tmdb-image';

/** Fare sıranın üzerinden hızla geçerken her afişte ışık değişmesin. */
const HOVER_INTENT_MS = 90;

interface FilmQueueProps {
  items: TitleSummary[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

/**
 * Perdede ne oynayacağını seçen sıra. Bağlantıdır, ayrıntıya götürür.
 * Fare üzerine gelince, klavye odaklanınca seçer. Dokunmatikte üzerine gelme olmadığı için
 * ilk dokunuş seçer, seçili afişe dokunmak ayrıntıya götürür.
 */
export function FilmQueue({ items, selectedId, onSelect }: FilmQueueProps) {
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastPointer = useRef('mouse');

  return (
    <ul
      aria-label="Bu hafta öne çıkanlar"
      className="no-scrollbar mt-6 flex snap-x scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 py-2 sm:mt-7 sm:scroll-px-1.5 sm:gap-5 sm:px-1.5"
    >
      {items.map((item) => {
        const active = item.id === selectedId;
        return (
          <li key={`${item.type}-${item.id}`} className="shrink-0 snap-start">
            <Link
              to={titlePath(item.type, item.id)}
              aria-current={active ? 'true' : undefined}
              aria-label={`${item.title}: ayrıntılara git`}
              onPointerEnter={(event) => {
                if (event.pointerType !== 'mouse') return;
                clearTimeout(hoverTimer.current);
                hoverTimer.current = setTimeout(() => onSelect(item.id), HOVER_INTENT_MS);
              }}
              onPointerLeave={() => clearTimeout(hoverTimer.current)}
              onPointerDown={(event) => {
                lastPointer.current = event.pointerType;
              }}
              onFocus={() => onSelect(item.id)}
              onClick={(event) => {
                if (lastPointer.current === 'mouse' || active) return;
                event.preventDefault();
                onSelect(item.id);
              }}
              className={`block aspect-[2/3] w-24 bg-room-raised outline-offset-4 sm:w-[7.375rem] ${
                active ? 'outline-2 outline-film' : ''
              }`}
            >
              {item.poster && (
                <img
                  src={tmdbImage(item.poster, 'w185')}
                  srcSet={tmdbSrcSet(item.poster, ['w185', 'w342'])}
                  sizes="7.5rem"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={`size-full object-cover transition-[filter] duration-200 ${
                    active ? '' : 'brightness-50 saturate-[0.8] hover:brightness-90'
                  }`}
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
