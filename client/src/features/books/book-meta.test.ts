import { describe, expect, it } from 'vitest';
import { bookMeta } from './book-meta';

describe('bookMeta', () => {
  it('yıl, sayfa ve puanı birlikte yazar', () => {
    expect(bookMeta({ year: 1985, rating: 7.8 }, { pageCount: 186 })).toBe(
      '1985 · 186\u00A0sayfa · Open Library 7,8',
    );
  });

  it('olmayan bilgiyi atlar', () => {
    expect(bookMeta({ year: 1985, rating: null }, undefined)).toBe('1985');
    expect(bookMeta({ year: null, rating: null }, { pageCount: null })).toBe('');
  });
});
