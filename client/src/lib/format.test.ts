import { describe, expect, it } from 'vitest';
import { formatCount, formatRating } from './format';

describe('sayı biçimleri', () => {
  it('puanları Türkçe ondalıkla ve tek basamakla yazar', () => {
    expect(formatRating(8.5)).toBe('8,5');
    expect(formatRating(8)).toBe('8,0');
  });

  it('büyük sayıları kısaltır', () => {
    // Intl sayı ile birim arasına bölünmez boşluk koyar.
    expect(formatCount(1_200_817).replace(/\s/g, ' ')).toBe('1,2 Mn');
  });
});
