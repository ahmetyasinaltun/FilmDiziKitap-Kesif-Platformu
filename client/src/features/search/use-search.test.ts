import { describe, expect, it } from 'vitest';
import { tabFromParam, uniqueResults } from './use-search';

describe('tabFromParam', () => {
  it('adresteki değerden sekmeyi bulur', () => {
    expect(tabFromParam('kitap').type).toBe('book');
  });

  it('bilinmeyen ya da boş değerde Tümü sekmesine döner', () => {
    expect(tabFromParam(null).id).toBe('all');
    expect(tabFromParam('uydurma').id).toBe('all');
  });
});

describe('uniqueResults', () => {
  it('sayfalar arasında tekrar eden kaydı atar, sırayı korur', () => {
    const item = (type: string, id: string) => ({ type, id });
    const pages = [
      { results: [item('movie', '1'), item('tv', '1')] },
      { results: [item('movie', '1'), item('movie', '2')] },
    ];

    expect(uniqueResults(pages)).toEqual([item('movie', '1'), item('tv', '1'), item('movie', '2')]);
  });

  it('veri yoksa boş liste döner', () => {
    expect(uniqueResults(undefined)).toEqual([]);
  });
});
