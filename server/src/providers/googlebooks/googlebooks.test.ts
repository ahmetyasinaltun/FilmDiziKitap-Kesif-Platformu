import { describe, expect, it } from 'vitest';
import { preferTurkishSpelling } from '../../services/books.js';
import { pickVolume, stripHtml } from './index.js';

const volume = (overrides: Record<string, unknown>) => ({
  title: 'Kürk Mantolu Madonna',
  language: 'tr',
  description: null,
  previewLink: null,
  ...overrides,
});

describe('pickVolume', () => {
  it('başlığı eşleşen Türkçe ciltlerden açıklaması olanı seçer', () => {
    const match = pickVolume(
      [
        volume({ description: null }),
        volume({ language: 'en', description: 'English' }),
        volume({ description: 'Türkçe açıklama' }),
      ],
      'Kürk Mantolu Madonna',
    );
    expect(match?.description).toBe('Türkçe açıklama');
  });

  it('başka kitabı eşleştirmez', () => {
    expect(
      pickVolume(
        [volume({ title: 'Kürk Mantolu Madonna Üzerine İnceleme' })],
        'Kürk Mantolu Madonna',
      ),
    ).toBeNull();
  });
});

describe('stripHtml', () => {
  it('HTML etiketlerini düz metne çevirir', () => {
    expect(stripHtml('<p>Bir <b>roman</b>.</p><p>İkinci&nbsp;paragraf</p>')).toBe(
      'Bir roman.\n\nİkinci paragraf',
    );
  });
});

describe('preferTurkishSpelling', () => {
  it('aynı kelimelerse Türkçe harfli yazılışı seçer', () => {
    expect(preferTurkishSpelling('Ucurtma Avcisi', 'Uçurtma Avcısı')).toBe('Uçurtma Avcısı');
  });

  it('farklı başlığı kabul etmez', () => {
    expect(preferTurkishSpelling('Huzur', 'Huzursuzluk')).toBe('Huzur');
    expect(preferTurkishSpelling('Huzur', undefined)).toBe('Huzur');
  });
});

describe('pickVolume (bağlantı)', () => {
  it('önizleme bağlantısını https yapar', () => {
    const match = pickVolume(
      [volume({ previewLink: 'http://books.google.com.tr/books?id=1' })],
      'Kürk Mantolu Madonna',
    );
    expect(match?.previewLink).toBe('https://books.google.com.tr/books?id=1');
  });
});
