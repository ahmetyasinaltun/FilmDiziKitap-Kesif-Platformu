import { describe, expect, it } from 'vitest';
import { softHyphenate } from './hyphenate';

/** Görünmez tireleri okunur hale getirir */
const show = (text: string) => softHyphenate(text).replaceAll('\u00AD', '-');

describe('softHyphenate', () => {
  it('Türkçe kelimeleri hece sınırından böler', () => {
    expect(show('Tutunamayanlar')).toBe('Tu-tu-na-ma-yan-lar');
    // Ünsüz kümesinde sonuncusu sonraki heceye geçer: kü-tüp-ha-ne
    expect(show('Kütüphanemizde')).toBe('Kü-tüp-ha-ne-miz-de');
  });

  it('kısa kelimelere dokunmaz', () => {
    expect(show('Kar')).toBe('Kar');
    expect(show('Beyaz Kale')).toBe('Beyaz Kale');
  });

  it('başta ve sonda tek harf bırakmaz', () => {
    expect(show('Aaaaaaaaaaaa').startsWith('A-')).toBe(false);
    expect(show('Resurrection').endsWith('-n')).toBe(false);
  });

  it('işaretli harfleri ünlü sayar, noktalama ve boşlukları korur', () => {
    expect(show('Nātyārambham')).toBe('Nāt-yā-ramb-ham');
    expect(show('Tutunamayanlar: Roman')).toBe('Tu-tu-na-ma-yan-lar: Roman');
  });
});
