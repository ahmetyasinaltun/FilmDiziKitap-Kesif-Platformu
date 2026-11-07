import { useRef } from 'react';
import { Link } from 'react-router';
import { CoverFrame } from '../../components/PosterRow';
import { contentPath, type ContentSummary } from '../../lib/content';
import { posterSources } from '../../lib/tmdb-image';

/** Fare sıranın üzerinden hızla geçerken her afişte ışık değişmesin. */
const HOVER_INTENT_MS = 90;

interface FilmQueueProps {
  items: ContentSummary[];
  /** Ekran okuyucular için sıranın adı */
  label: string;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

/**
 * Perdede ne oynayacağını seçen sıra. Bağlantıdır, ayrıntıya götürür.
 * Fare üzerine gelince, klavye odaklanınca seçer. Dokunmatikte üzerine gelme olmadığı için
 * ilk dokunuş seçer, seçili afişe dokunmak ayrıntıya götürür.
 *
 * Seçili olup olmadığı dokunma anında saklanır: Android'de odak olayı tıklamadan önce gelir,
 * tıklama anına bakılsaydı afiş o sırada seçilmiş olur ve ilk dokunuş ayrıntıya giderdi.
 */
export function FilmQueue({ items, label, selectedId, onSelect }: FilmQueueProps) {
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pointer = useRef({ type: 'mouse', wasActive: false });

  return (
    <ul
      aria-label={label}
      className="row-scroll queue-bleed mt-5 flex snap-x scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 py-2 sm:scroll-px-1.5 sm:gap-5 sm:px-1.5"
    >
      {items.map((item) => {
        const active = item.id === selectedId;
        return (
          <li key={`${item.type}-${item.id}`} className="shrink-0 snap-start">
            <Link
              to={contentPath(item.type, item.id)}
              aria-current={active ? 'true' : undefined}
              aria-label={`${item.title}: ayrıntılara git`}
              onPointerEnter={(event) => {
                if (event.pointerType !== 'mouse') return;
                clearTimeout(hoverTimer.current);
                hoverTimer.current = setTimeout(() => onSelect(item.id), HOVER_INTENT_MS);
              }}
              onPointerLeave={() => clearTimeout(hoverTimer.current)}
              onPointerDown={(event) => {
                pointer.current = { type: event.pointerType, wasActive: active };
              }}
              onFocus={() => onSelect(item.id)}
              onClick={(event) => {
                // detail 0: klavyeyle (Enter) gelen tıklama.
                if (event.detail === 0) return;
                if (pointer.current.type === 'mouse' || pointer.current.wasActive) return;
                event.preventDefault();
                onSelect(item.id);
              }}
              className={`block w-24 outline-offset-4 sm:w-[7.375rem] ${
                active ? 'outline-2 outline-film' : ''
              }`}
            >
              <CoverFrame title={item.title} compact>
                {item.poster && (
                  <img
                    {...posterSources(item.poster)}
                    sizes="7.5rem"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className={`relative size-full object-cover transition-[filter] duration-200 ${
                      active ? '' : 'brightness-50 saturate-[0.8] hover:brightness-90'
                    }`}
                  />
                )}
              </CoverFrame>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
