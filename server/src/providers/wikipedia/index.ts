/**
 * Türkçe Vikipedi: kitapların Türkçe açıklaması (maddenin giriş bölümü).
 * Doğru maddeyi bulmak için önce Wikidata'da Open Library eser kimliği (P648) aranır; bu kesin
 * bir eşleşmedir. Yoksa Vikipedi'de başlık + yazar ile aranır ve sadece başlığı birebir tutan,
 * metninde yazarın adı geçen madde kabul edilir. Metin CC BY-SA 4.0: arayüzde kaynak ve
 * bağlantı gösterilmesi zorunlu. Ölçüm (46 kitap): %85'inde doğru Türkçe açıklama.
 */
import { z } from 'zod';
import { env } from '../../config/env.js';
import { cached } from '../../lib/api-cache.js';
import { fetchJson } from '../../lib/http.js';
import { lenientArray } from '../../lib/schema.js';
import { normalizeForMatch } from '../openlibrary/mappers.js';

const VERSION = 1;

export interface WikipediaArticle {
  title: string;
  extract: string;
  url: string;
}

const headers = () => ({ 'User-Agent': env.APP_USER_AGENT });

function apiUrl(host: string, params: Record<string, string>): URL {
  const url = new URL(`https://${host}/w/api.php`);
  url.search = new URLSearchParams({ format: 'json', formatversion: '2', ...params }).toString();
  return url;
}

const wikidataSearchSchema = z.object({
  query: z.object({ search: lenientArray(z.object({ title: z.string() })) }).optional(),
});

const sitelinksSchema = z.object({
  entities: z
    .record(
      z.string(),
      z.object({ sitelinks: z.record(z.string(), z.object({ title: z.string() })).optional() }),
    )
    .optional(),
});

const pagesSchema = z.object({
  query: z
    .object({
      pages: lenientArray(
        z.object({
          title: z.string(),
          missing: z.boolean().optional(),
          /** Arama sonucundaki sıra */
          index: z.number().optional(),
          extract: z.string().optional(),
          pageprops: z.record(z.string(), z.string()).optional(),
        }),
      ),
    })
    .optional(),
});
type WikiPage = NonNullable<z.output<typeof pagesSchema>['query']>['pages'][number];

/** Madde adındaki açıklama parantezini atar: "Huzur (roman)" → "Huzur" */
export function baseTitle(pageTitle: string): string {
  return pageTitle.replace(/\s*\([^)]*\)$/, '');
}

export function titleMatches(pageTitle: string, bookTitle: string): boolean {
  return normalizeForMatch(baseTitle(pageTitle)) === normalizeForMatch(bookTitle);
}

/** Yazarın soyadı metinde geçiyor mu ("Sabahattin Ali'nin" → "ali") */
export function mentionsAuthor(text: string, author: string): boolean {
  const lastName = normalizeForMatch(author).split(' ').pop();
  return (
    !!lastName &&
    normalizeForMatch(text)
      .split(' ')
      .some((word) => word.startsWith(lastName))
  );
}

export function articleUrl(title: string): string {
  return `https://tr.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
}

/** Anlam ayrımı sayfası değilse ve metni varsa maddeyi döner. */
export function toArticle(page: WikiPage | undefined): WikipediaArticle | null {
  const extract = page?.extract?.replace(/\n{3,}/g, '\n\n').trim();
  if (!page || page.missing || !extract || page.pageprops?.disambiguation !== undefined)
    return null;
  return { title: page.title, extract, url: articleUrl(page.title) };
}

const EXTRACT_PARAMS = {
  prop: 'extracts|pageprops',
  exintro: '1',
  explaintext: '1',
  redirects: '1',
};

/** Wikidata'da Open Library eser kimliği (P648) ile kayıtlı öğenin Türkçe Vikipedi maddesi */
async function titleFromWikidata(workId: string): Promise<string | null> {
  const search = await fetchJson({
    provider: 'Vikipedi',
    url: apiUrl('www.wikidata.org', {
      action: 'query',
      list: 'search',
      srsearch: `haswbstatement:P648=${workId}`,
      srlimit: '1',
    }),
    schema: wikidataSearchSchema,
    headers: headers(),
  });
  const qid = search.query?.search[0]?.title;
  if (!qid) return null;
  const entity = await fetchJson({
    provider: 'Vikipedi',
    url: apiUrl('www.wikidata.org', {
      action: 'wbgetentities',
      ids: qid,
      props: 'sitelinks',
      sitefilter: 'trwiki',
    }),
    schema: sitelinksSchema,
    headers: headers(),
  });
  return entity.entities?.[qid]?.sitelinks?.trwiki?.title ?? null;
}

async function articleByTitle(title: string): Promise<WikipediaArticle | null> {
  const result = await fetchJson({
    provider: 'Vikipedi',
    url: apiUrl('tr.wikipedia.org', { action: 'query', titles: title, ...EXTRACT_PARAMS }),
    schema: pagesSchema,
    headers: headers(),
  });
  return toArticle(result.query?.pages[0]);
}

/** Başlık + yazar ile arama; tek istekte ilk 3 sonucun giriş metni de gelir. */
async function articleBySearch(title: string, author: string): Promise<WikipediaArticle | null> {
  const result = await fetchJson({
    provider: 'Vikipedi',
    url: apiUrl('tr.wikipedia.org', {
      action: 'query',
      generator: 'search',
      gsrsearch: `${title} ${author}`,
      gsrlimit: '3',
      ...EXTRACT_PARAMS,
    }),
    schema: pagesSchema,
    headers: headers(),
  });
  const pages = [...(result.query?.pages ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  for (const page of pages) {
    const article = toArticle(page);
    if (article && titleMatches(page.title, title) && mentionsAuthor(article.extract, author)) {
      return article;
    }
  }
  return null;
}

/** Önbellekte `null` saklanamadığı için sonuç bir zarf içinde: "bulunamadı" da önbelleğe alınır. */
export function findBookArticle(
  workId: string,
  title: string,
  author: string | null,
): Promise<{ article: WikipediaArticle | null }> {
  return cached(`wiki:v${VERSION}:book:${workId}`, { ttl: 30 * 24 * 60 * 60 }, async () => {
    const linkedTitle = await titleFromWikidata(workId);
    if (linkedTitle) {
      const article = await articleByTitle(linkedTitle);
      if (article) return { article };
    }
    // Yazarı bilinmeyen kitapta başlık aramayla doğrulanamaz; yanlış madde riskine girilmez.
    return { article: author ? await articleBySearch(title, author) : null };
  });
}
