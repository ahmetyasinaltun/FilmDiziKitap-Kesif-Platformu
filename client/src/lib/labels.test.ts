import { describe, expect, it } from 'vitest';
import type { PersonRole } from './content';
import { isMinorCredit, roleLabel } from './labels';

const cast = (name: string): PersonRole => ({ name, department: null });
const crew = (name: string, department: string): PersonRole => ({ name, department });

describe('roleLabel', () => {
  it('kendisi olarak görünmeyi Türkçeye çevirir, TMDB yazım hatası dahil', () => {
    expect(roleLabel(cast('Self'))).toBe('Kendisi');
    expect(roleLabel(cast('Self - Director / Writer / Producer'))).toBe('Kendisi');
    expect(roleLabel(cast('Selft'))).toBe('Kendisi');
    expect(roleLabel(cast('Himself'))).toBe('Kendisi');
  });

  it('karakter adını korur, TMDB notlarını çevirir', () => {
    expect(roleLabel(cast('Bruce Wayne'))).toBe('Bruce Wayne');
    expect(roleLabel(cast('Selfridge'))).toBe('Selfridge');
    expect(roleLabel(cast('Sykes (voice)'))).toBe('Sykes (seslendirme)');
    expect(roleLabel(cast('Waiter (uncredited)'))).toBe('Waiter (jenerikte adı yok)');
  });

  it('ekip görevini çevirir, bilinmeyen görevde ekibin adını yazar', () => {
    expect(roleLabel(crew('Director', 'Directing'))).toBe('Yönetmen');
    expect(roleLabel(crew('Decorator', 'Art'))).toBe('Dekoratör');
    expect(roleLabel(crew('Visual Effects Camera', 'Visual Effects'))).toBe('Görsel efekt ekibi');
    expect(roleLabel(crew('Something New', 'Unknown Department'))).toBe('Ekip');
  });
});

describe('isMinorCredit', () => {
  it('sadece kendisi, arşiv ve teşekkür kayıtlarını ikincil sayar', () => {
    expect(isMinorCredit([cast('Self')])).toBe(true);
    expect(isMinorCredit([crew('Thanks', 'Crew')])).toBe(true);
    expect(
      isMinorCredit([cast('Self - Filmmaker (archive footage)'), crew('Thanks', 'Crew')]),
    ).toBe(true);
  });

  it('asıl bir görev varsa kayıt asıl iştir', () => {
    expect(isMinorCredit([crew('Director', 'Directing'), crew('Thanks', 'Crew')])).toBe(false);
    expect(isMinorCredit([crew('Executive Producer', 'Production')])).toBe(false);
    expect(isMinorCredit([cast('Bruce Wayne')])).toBe(false);
    expect(isMinorCredit([])).toBe(false);
  });
});
