import { useEffect, useRef, type ReactNode } from 'react';
import { CloseIcon } from '../../components/icons';
import { LightImage } from './LightImage';

/** Perdeden odaya yayılan ışık. Küçük görsel büyütülerek bulanıklaştırılır: tam boy görselin bulanığı telefonda ağır kalır. */
export function RoomLight({ path }: { path: string | null }) {
  return (
    <div aria-hidden="true" className="room-light">
      <div className="room-light-inner">
        <LightImage path={path} variant="light" className="room-light-image" />
      </div>
    </div>
  );
}

interface PerdeProps {
  path: string | null;
  title: string;
  /** Doluysa fragman perdede oynar ve ışıklar söner. */
  playingTrailer: string | null;
  onCloseTrailer: () => void;
  /** Altyazı */
  children: ReactNode;
}

export function Perde({ path, title, playingTrailer, onCloseTrailer, children }: PerdeProps) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const playing = playingTrailer !== null;

  useEffect(() => {
    if (!playing) return;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseTrailer();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [playing, onCloseTrailer]);

  return (
    <>
      {playing && (
        <div
          aria-hidden="true"
          onClick={onCloseTrailer}
          className="lights-off fixed inset-0 z-20 bg-room/95"
        />
      )}

      <div className={`relative ${playing ? 'z-30' : ''}`}>
        <div aria-hidden="true" className="perde-floor">
          <LightImage path={path} variant="light" className="room-light-image" />
        </div>

        <div className="perde-screen relative aspect-[16/10] overflow-hidden bg-room-raised sm:aspect-[2.39/1]">
          <LightImage
            path={path}
            variant="screen"
            className="absolute inset-0 size-full object-cover object-[center_30%]"
          />

          {playingTrailer ? (
            <>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(playingTrailer)}?autoplay=1&rel=0`}
                title={`${title} fragmanı`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 size-full border-0"
              />
              <button
                ref={closeButton}
                type="button"
                onClick={onCloseTrailer}
                aria-label="Fragmanı kapat"
                className="pressable absolute right-3 top-3 grid size-11 cursor-pointer place-items-center rounded-full bg-room/80 text-light hover:bg-room"
              >
                <CloseIcon />
              </button>
            </>
          ) : (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-room/70 to-transparent px-3 pb-3 pt-16 sm:pb-6">
              {children}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
