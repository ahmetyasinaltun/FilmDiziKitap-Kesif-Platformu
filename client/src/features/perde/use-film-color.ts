import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { pickFilmColor } from '../../lib/film-color';
import { tmdbImage } from '../../lib/tmdb-image';

const SAMPLE_WIDTH = 48;
const SAMPLE_HEIGHT = 27;

/** TMDB görselleri CORS'a açık; bu yüzden tarayıcıda küçük bir tuvale çizilip okunabiliyor. */
async function readFilmColor(path: string): Promise<string | null> {
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
  return pickFilmColor(context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data);
}

/**
 * Görselin rengi, hazır olana kadar önceki renk. Okunamazsa null döner ve tasarımın
 * yedek rengi kullanılır; bu süs olduğu için hatası kullanıcıya gösterilmez.
 */
export function useFilmColor(path: string | null): string | null {
  const { data } = useQuery({
    queryKey: ['film-color', path],
    queryFn: () => readFilmColor(path ?? ''),
    enabled: path !== null,
    staleTime: Infinity,
    retry: false,
    placeholderData: keepPreviousData,
  });
  return data ?? null;
}
