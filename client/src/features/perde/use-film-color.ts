import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { pickFilmColor, pickLightStrength } from '../../lib/film-color';
import { tmdbImage } from '../../lib/tmdb-image';

const SAMPLE_WIDTH = 48;
const SAMPLE_HEIGHT = 27;

interface FilmLight {
  /** Vurgu rengi; görselde canlı renk yoksa null ve tasarımın yedek rengi kullanılır */
  color: string | null;
  /** Oda ışığının açıklığı (0-1) */
  strength: number;
}

/** TMDB görselleri CORS'a açık; bu yüzden tarayıcıda küçük bir tuvale çizilip okunabiliyor. */
async function readFilmLight(path: string): Promise<FilmLight | null> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = tmdbImage(path, 'w300');
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_WIDTH;
  canvas.height = SAMPLE_HEIGHT;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(image, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  const { data } = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  return { color: pickFilmColor(data), strength: pickLightStrength(data) };
}

/**
 * Görselin rengi ve parlaklığı; hazır olana kadar öncekiler. Okunamazsa null döner ve tasarımın
 * yedek değerleri kullanılır; bu süs olduğu için hatası kullanıcıya gösterilmez.
 */
export function useFilmLight(path: string | null): FilmLight | null {
  const { data } = useQuery({
    queryKey: ['film-light', path],
    queryFn: () => readFilmLight(path ?? ''),
    enabled: path !== null,
    staleTime: Infinity,
    retry: false,
    placeholderData: keepPreviousData,
  });
  return data ?? null;
}
