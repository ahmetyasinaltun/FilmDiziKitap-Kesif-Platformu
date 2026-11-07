import { useState } from 'react';
import { tmdbImage, tmdbSrcSet } from '../../lib/tmdb-image';

type Variant = 'screen' | 'light';

interface Layer {
  id: number;
  path: string;
  ready: boolean;
}

function imageProps(path: string, variant: Variant) {
  // CORS kipi şart: renk bu görselden okunuyor. Aynı adres önce düz <img> ile yüklenirse
  // tarayıcı izinsiz kopyayı önbelleğe alır ve renk okuma isteği de onu kullanıp reddedilir.
  if (variant === 'light') {
    return { src: tmdbImage(path, 'w300'), crossOrigin: 'anonymous' as const };
  }
  return {
    src: tmdbImage(path, 'w1280'),
    srcSet: tmdbSrcSet(path, ['w780', 'w1280']),
    sizes: '(min-width: 40rem) 70rem, 100vw',
    // Sayfanın ilk görseli: tembel yükleme burada ilk boyamayı geciktirirdi.
    fetchPriority: 'high' as const,
  };
}

interface LightImageProps {
  path: string | null;
  variant: Variant;
  className?: string;
}

/**
 * Görsel değişince yenisi yüklenip eskisinin üstünde çözülür; bitince alttakiler kaldırılır.
 * Eski görsel yenisi hazır olana kadar durduğu için hızlı geçişlerde ekran boş kalmaz.
 */
export function LightImage({ path, variant, className = '' }: LightImageProps) {
  const [layers, setLayers] = useState<Layer[]>([]);

  const top = layers.at(-1);
  if (path && path !== top?.path) {
    setLayers([
      ...layers.filter((layer) => layer.ready),
      { id: (top?.id ?? 0) + 1, path, ready: false },
    ]);
  }

  return layers.map((layer) => (
    <img
      key={layer.id}
      {...imageProps(layer.path, variant)}
      alt=""
      decoding="async"
      data-ready={layer.ready}
      className={`light-fade ${className}`}
      onLoad={() =>
        setLayers((current) =>
          current.map((item) => (item.id === layer.id ? { ...item, ready: true } : item)),
        )
      }
      onTransitionEnd={(event) => {
        if (event.propertyName !== 'opacity') return;
        setLayers((current) => current.filter((item) => item.id >= layer.id));
      }}
    />
  ));
}
