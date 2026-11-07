/**
 * Görselin piksellerinden filmin rengini seçer. Ortalama almak her görseli çamur rengine
 * çevirdiği için renk tonları 12 dilime ayrılır ve en güçlü canlı dilim seçilir.
 * Sonuç düğme zemini olarak kullanılacağı için üstündeki koyu yazıyla kontrastı garanti edilir.
 */

interface Hsl {
  h: number;
  s: number;
  l: number;
}

const HUE_BINS = 12;
const MIN_SATURATION = 0.2;
const MIN_LIGHTNESS = 0.12;
const MAX_LIGHTNESS = 0.9;
/** Koyu yazıyla (--color-film-ink) en az 4,5:1 kontrast için gereken bağıl parlaklık (0,2022 + pay) */
const MIN_LUMINANCE = 0.21;

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l };

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / delta + 6) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  return { h: h * 60, s, l };
}

function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [channel(0), channel(8), channel(4)];
}

/** WCAG bağıl parlaklığı */
function luminance(color: Hsl): number {
  const [r, g, b] = hslToRgb(color).map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Çok koyu veya çok soluk renkleri düğme olabilecek aralığa taşır. */
export function toButtonColor(color: Hsl): Hsl {
  const result = { h: color.h, s: clamp(color.s, 0.45, 0.8), l: clamp(color.l, 0.6, 0.72) };
  while (luminance(result) < MIN_LUMINANCE && result.l < 0.9) result.l += 0.02;
  return result;
}

/** RGBA piksel dizisinden (`getImageData().data`) CSS rengi üretir; canlı renk yoksa null. */
export function pickFilmColor(pixels: ArrayLike<number>): string | null {
  const bins = Array.from({ length: HUE_BINS }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));

  for (let i = 0; i + 2 < pixels.length; i += 4) {
    const [r, g, b] = [pixels[i] ?? 0, pixels[i + 1] ?? 0, pixels[i + 2] ?? 0];
    const { h, s, l } = rgbToHsl(r, g, b);
    if (s < MIN_SATURATION || l < MIN_LIGHTNESS || l > MAX_LIGHTNESS) continue;

    const bin = bins[Math.floor(h / (360 / HUE_BINS)) % HUE_BINS];
    if (!bin) continue;
    const weight = s * (1 - Math.abs(2 * l - 1));
    bin.weight += weight;
    bin.r += r * weight;
    bin.g += g * weight;
    bin.b += b * weight;
  }

  const best = bins.reduce((top, bin) => (bin.weight > top.weight ? bin : top));
  if (best.weight === 0) return null;

  const { h, s, l } = toButtonColor(
    rgbToHsl(best.r / best.weight, best.g / best.weight, best.b / best.weight),
  );
  return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

/** Koyu görselde oda ışığının açıklığı; üst sınır */
const MAX_ROOM_LIGHT = 0.6;
/** Ortalama parlaklığı (0-255) bu değere inecek kadar kıs: salon karanlık kalsın. */
const ROOM_BRIGHTNESS = 30;

/** Görselin ortalama parlaklığına göre oda ışığının açıklığı (0-1). */
export function pickLightStrength(pixels: ArrayLike<number>): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i + 2 < pixels.length; i += 4) {
    sum += ((pixels[i] ?? 0) + (pixels[i + 1] ?? 0) + (pixels[i + 2] ?? 0)) / 3;
    count += 1;
  }
  if (sum === 0) return MAX_ROOM_LIGHT;
  return Math.min(ROOM_BRIGHTNESS / (sum / count), MAX_ROOM_LIGHT);
}

export const luminanceOf = luminance;
