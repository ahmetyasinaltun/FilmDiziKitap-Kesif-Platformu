import { describe, expect, it } from 'vitest';
import type { WatchProviders } from '../../lib/content';
import { scoreLine, whereLine } from './decision';

const provider = (name: string, id = 1) => ({ id, name, logo: null });
const watch = (parts: Partial<WatchProviders>): WatchProviders => ({
  link: null,
  stream: [],
  free: [],
  rent: [],
  buy: [],
  ...parts,
});

describe('scoreLine', () => {
  it('tüm puanları sırayla yazar', () => {
    expect(
      scoreLine({
        rating: 8.5,
        externalRatings: {
          imdb: { rating: 8.5, votes: 1000 },
          rottenTomatoes: 99,
          metacritic: 97,
        },
      }),
    ).toBe('IMDb 8,5 · Rotten Tomatoes %99 · Metacritic 97');
  });

  it('olmayan puanı atlar, 0 puanı yok saymaz', () => {
    expect(
      scoreLine({
        rating: 7,
        externalRatings: { imdb: null, rottenTomatoes: 0, metacritic: null },
      }),
    ).toBe('Rotten Tomatoes %0');
  });

  it('dış puan yoksa TMDB puanına, o da yoksa boşa düşer', () => {
    expect(scoreLine({ rating: 7.4, externalRatings: null })).toBe('TMDB 7,4');
    expect(scoreLine({ rating: null, externalRatings: null })).toBeNull();
  });
});

describe('whereLine', () => {
  it('abonelik platformlarını önce yazar', () => {
    expect(
      whereLine(watch({ stream: [provider('TV+')], rent: [provider('Amazon Video')] }), true),
    ).toBe("Türkiye'de: TV+");
  });

  it('fazla platformu sayıyla kısaltır', () => {
    const stream = ['A', 'B', 'C', 'D', 'E'].map((name, i) => provider(name, i));
    expect(whereLine(watch({ stream }), false)).toBe("Türkiye'de: A, B, C ve 2 platform daha");
  });

  it('platformda değilse sinemada, kiralıkta, satışta olduğunu söyler', () => {
    expect(whereLine(null, true)).toBe("Türkiye'de sinemalarda");
    expect(whereLine(watch({ rent: [provider('Amazon Video')] }), false)).toBe(
      'Kiralık: Amazon Video',
    );
    expect(whereLine(watch({ buy: [provider('Apple TV Store')] }), false)).toBe(
      'Satın alınabilir: Apple TV Store',
    );
  });

  it('veri yoksa bunu açıkça söyler', () => {
    expect(whereLine(null, false)).toBe("Türkiye'de platform bilgisi yok");
  });
});
