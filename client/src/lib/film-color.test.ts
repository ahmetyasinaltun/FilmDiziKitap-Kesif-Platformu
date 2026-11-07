import { describe, expect, it } from 'vitest';
import { luminanceOf, pickFilmColor, pickLightStrength, toButtonColor } from './film-color';

/** Aynı renkten n piksel */
const pixels = (rgb: [number, number, number], n: number) =>
  Array.from({ length: n }, () => [...rgb, 255]).flat();

describe('pickFilmColor', () => {
  it('griler arasından canlı rengi bulur', () => {
    const image = [...pixels([60, 60, 60], 500), ...pixels([200, 120, 30], 50)];
    const color = pickFilmColor(image);

    expect(color).not.toBeNull();
    const hue = Number(color?.match(/hsl\((\d+)/)?.[1]);
    expect(hue).toBeGreaterThan(20);
    expect(hue).toBeLessThan(45);
  });

  it('siyah beyaz görselde renk uydurmaz', () => {
    expect(pickFilmColor([...pixels([10, 10, 10], 50), ...pixels([240, 240, 240], 50)])).toBeNull();
  });
});

describe('pickLightStrength', () => {
  it('koyu görselde ışık tam açık', () => {
    expect(pickLightStrength(pixels([20, 20, 20], 10))).toBe(0.6);
  });

  it('parlak görselde kısılır ama hiç sönmez', () => {
    expect(pickLightStrength(pixels([100, 100, 100], 10))).toBeCloseTo(0.3);
    expect(pickLightStrength(pixels([255, 255, 255], 10))).toBe(0.2);
  });

  it('boş veride varsayılan değeri döner', () => {
    expect(pickLightStrength([])).toBe(0.6);
  });
});

describe('toButtonColor', () => {
  it.each([
    ['koyu mavi', { h: 240, s: 0.9, l: 0.3 }],
    ['koyu mor', { h: 280, s: 0.5, l: 0.2 }],
    ['koyu kırmızı', { h: 0, s: 0.7, l: 0.2 }],
  ])('%s, koyu yazı okunacak kadar açılır', (_name, color) => {
    expect(luminanceOf(toButtonColor(color))).toBeGreaterThanOrEqual(0.2);
  });
});
