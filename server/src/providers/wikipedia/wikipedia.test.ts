import { describe, expect, it } from 'vitest';
import { chooseDescription, SHORT_DESCRIPTION } from '../../services/books.js';
import { articleUrl, baseTitle, mentionsAuthor, titleMatches, toArticle } from './index.js';

describe('madde eşleştirme', () => {
  it('açıklama parantezini yok sayar', () => {
    expect(baseTitle('Huzur (roman)')).toBe('Huzur');
    expect(titleMatches('Çalıkuşu (roman)', 'Çalıkuşu')).toBe(true);
    expect(titleMatches('Kar', 'Kar')).toBe(true);
    expect(titleMatches('Kar (meteoroloji)', 'Kar Tanesi')).toBe(false);
  });

  it('yazarın soyadını Türkçe ekleriyle de tanır', () => {
    expect(
      mentionsAuthor("Kürk Mantolu Madonna, Sabahattin Ali'nin romanıdır.", 'Sabahattin Ali'),
    ).toBe(true);
    expect(
      mentionsAuthor("Huzur, Ahmet Hamdi Tanpınar'ın ilk romanı.", 'Ahmet Hamdi Tanpinar'),
    ).toBe(true);
    expect(mentionsAuthor('Kar, yağış türüdür.', 'Orhan Pamuk')).toBe(false);
  });

  it('anlam ayrımı ve boş sayfaları kabul etmez', () => {
    expect(
      toArticle({
        title: 'Kar',
        extract: 'Kar şunlardan biri olabilir:',
        pageprops: { disambiguation: '' },
      }),
    ).toBeNull();
    expect(toArticle({ title: 'Yok', missing: true })).toBeNull();
    expect(toArticle({ title: 'Boş', extract: '  ' })).toBeNull();
  });

  it('madde bağlantısını kodlar', () => {
    expect(articleUrl('Kar (roman)')).toBe('https://tr.wikipedia.org/wiki/Kar_(roman)');
  });
});

describe('chooseDescription', () => {
  const long = 'Uzun bir Vikipedi açıklaması. '.repeat(10);
  const wiki = (extract: string) => ({
    title: 'X',
    extract,
    url: 'https://tr.wikipedia.org/wiki/X',
  });
  const google = (description: string | null) => ({
    title: 'X',
    description,
    previewLink: 'https://g',
  });

  it('yeterince uzun Vikipedi açıklamasını seçer', () => {
    expect(long.length).toBeGreaterThanOrEqual(SHORT_DESCRIPTION);
    expect(
      chooseDescription({
        wikipedia: wiki(long),
        google: google('Daha da uzun ' + long),
        openLibrary: 'EN',
      }),
    ).toMatchObject({ source: 'Vikipedi', url: 'https://tr.wikipedia.org/wiki/X' });
  });

  it('Vikipedi kısaysa daha uzun Google Books açıklamasını seçer', () => {
    expect(
      chooseDescription({ wikipedia: wiki('Kısa.'), google: google(long), openLibrary: null }),
    ).toMatchObject({ source: 'Google Books' });
  });

  it('Google Books yoksa kısa Vikipedi açıklaması da İngilizceden iyidir', () => {
    expect(
      chooseDescription({ wikipedia: wiki('Kısa.'), google: null, openLibrary: 'English text' }),
    ).toMatchObject({ source: 'Vikipedi', text: 'Kısa.' });
  });

  it('Türkçe kaynak yoksa Open Library, o da yoksa null', () => {
    expect(
      chooseDescription({ wikipedia: null, google: google(null), openLibrary: 'English' }),
    ).toEqual({
      text: 'English',
      source: 'Open Library',
      url: null,
    });
    expect(chooseDescription({ wikipedia: null, google: null, openLibrary: null })).toBeNull();
  });
});
