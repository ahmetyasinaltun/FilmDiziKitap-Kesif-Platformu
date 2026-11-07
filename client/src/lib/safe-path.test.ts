import { describe, expect, it } from 'vitest';
import { safeNextPath } from './safe-path';

describe('safeNextPath', () => {
  it('site içi adresleri kabul eder', () => {
    expect(safeNextPath('/film/27205')).toBe('/film/27205');
    expect(safeNextPath('/arama?q=kar')).toBe('/arama?q=kar');
  });

  it.each(['https://kotu.com', '//kotu.com', '/\\kotu.com', 'javascript:alert(1)', ''])(
    'dışarı çıkan ya da geçersiz adresi reddeder: %s',
    (value) => {
      expect(safeNextPath(value)).toBe('/');
    },
  );

  it('değer yoksa varsayılana döner', () => {
    expect(safeNextPath(null, '/kutuphane')).toBe('/kutuphane');
  });
});
