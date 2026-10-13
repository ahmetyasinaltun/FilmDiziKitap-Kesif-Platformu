import { describe, expect, it } from 'vitest';
import { toExternalRatings } from './index.js';

describe('toExternalRatings', () => {
  it('üç kaynağın puanını sayıya çevirir', () => {
    expect(
      toExternalRatings({
        Response: 'True',
        imdbRating: '8.8',
        imdbVotes: '2,877,173',
        Ratings: [
          { Source: 'Internet Movie Database', Value: '8.8/10' },
          { Source: 'Rotten Tomatoes', Value: '86%' },
          { Source: 'Metacritic', Value: '74/100' },
        ],
      }),
    ).toEqual({ imdb: { rating: 8.8, votes: 2877173 }, rottenTomatoes: 86, metacritic: 74 });
  });

  it('"N/A" ve eksik kaynaklar null olur', () => {
    expect(
      toExternalRatings({ Response: 'True', imdbRating: 'N/A', imdbVotes: 'N/A', Ratings: [] }),
    ).toEqual({ imdb: null, rottenTomatoes: null, metacritic: null });
  });
});
