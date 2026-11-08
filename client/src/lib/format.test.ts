import { describe, expect, it } from 'vitest';
import { formatCount, formatDate, formatRating, yearIn } from './format';

describe('sayı biçimleri', () => {
  it('puanları Türkçe ondalıkla ve tek basamakla yazar', () => {
    expect(formatRating(8.5)).toBe('8,5');
    expect(formatRating(8)).toBe('8,0');
  });

  it('tarihi Türkçe ay adıyla ve kaymadan yazar', () => {
    expect(formatDate('1970-07-30')).toBe('30 Temmuz 1970');
  });

  it('serbest metinden yılı çıkarır', () => {
    expect(yearIn('30 July 1818')).toBe(1818);
    expect(yearIn('c. 1550')).toBe(1550);
    expect(yearIn(null)).toBeNull();
    expect(yearIn('bilinmiyor')).toBeNull();
  });

  it('büyük sayıları kısaltır', () => {
    // Intl sayı ile birim arasına bölünmez boşluk koyar.
    expect(formatCount(1_200_817).replace(/\s/g, ' ')).toBe('1,2 Mn');
  });
});
