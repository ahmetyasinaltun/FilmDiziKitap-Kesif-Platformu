import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { lenientArray, optionalText, text } from './schema.js';

const LRM = String.fromCharCode(0x200e);

describe('metin şemaları', () => {
  it('görünmez yön karakterlerini ve boşlukları temizler', () => {
    expect(text.parse(`${LRM}Ofis${LRM} `)).toBe('Ofis');
  });

  it('boş, null ve eksik değerleri null yapar', () => {
    expect(optionalText.parse('')).toBeNull();
    expect(optionalText.parse(`  ${LRM}`)).toBeNull();
    expect(optionalText.parse(null)).toBeNull();
    expect(optionalText.parse(undefined)).toBeNull();
  });
});

describe('lenientArray', () => {
  it('bozuk öğeleri atlar, geri kalanını korur', () => {
    const schema = lenientArray(z.object({ id: z.number() }));
    expect(schema.parse([{ id: 1 }, { id: 'bozuk' }, null, { id: 3 }])).toEqual([
      { id: 1 },
      { id: 3 },
    ]);
  });
});
