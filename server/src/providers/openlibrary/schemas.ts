/**
 * Open Library ham yanıt şemaları. Belgeler: https://openlibrary.org/developers/api
 */
import { z } from 'zod';
import { lenientArray, optionalText, text } from '../../lib/schema.js';

const count = z
  .number()
  .nullish()
  .transform((value) => value ?? 0);
const stringList = z.array(z.string()).nullish();

/** Açıklama ve biyografi bazen düz metin, bazen `{ type, value }` nesnesi olarak gelir. */
const looseText = z
  .union([z.string(), z.object({ value: z.string() })])
  .nullish()
  .transform((value) => (typeof value === 'string' ? value : (value?.value ?? null)));

/** Arama sonucundaki baskı (`lang=tr` ile istendiğinde varsa Türkçe baskı) */
const editionSchema = z.object({
  key: z.string(),
  title: optionalText,
  language: stringList,
  cover_i: z.number().nullish(),
  publisher: z.array(text).nullish(),
  isbn: stringList,
  number_of_pages: z.number().nullish(),
});
export type OlEdition = z.output<typeof editionSchema>;

export const searchDocSchema = z.object({
  /** "/works/OL1168083W" */
  key: z.string(),
  title: text,
  author_name: z.array(text).nullish(),
  author_key: stringList,
  first_publish_year: z.number().nullish(),
  cover_i: z.number().nullish(),
  edition_count: count,
  number_of_pages_median: z.number().nullish(),
  ratings_average: z.number().nullish(),
  ratings_count: count,
  editions: z.object({ docs: lenientArray(editionSchema) }).nullish(),
});
export type OlSearchDoc = z.output<typeof searchDocSchema>;

export const searchResponseSchema = z.object({
  numFound: z.number(),
  docs: lenientArray(searchDocSchema),
});

/** Arama isteğinde istenen alanlar (gereksiz alanlar gelmesin, yanıt küçük kalsın) */
export const SEARCH_FIELDS = [
  'key',
  'title',
  'author_name',
  'author_key',
  'first_publish_year',
  'cover_i',
  'edition_count',
  'number_of_pages_median',
  'ratings_average',
  'ratings_count',
  'editions',
  'editions.key',
  'editions.title',
  'editions.language',
  'editions.cover_i',
  'editions.publisher',
  'editions.isbn',
  'editions.number_of_pages',
].join(',');

const typeSchema = z.object({ key: z.string() });

export const workSchema = z.object({
  key: z.string(),
  title: text.optional(),
  description: looseText,
  type: typeSchema.optional(),
  /** Birleştirilmiş eserlerde yönlendirme hedefi ("/works/OL...W") */
  location: z.string().optional(),
});
export type OlWork = z.output<typeof workSchema>;

export const authorSchema = z.object({
  key: z.string(),
  name: text.optional(),
  bio: looseText,
  birth_date: optionalText,
  death_date: optionalText,
  photos: z.array(z.number()).nullish(),
  type: typeSchema.optional(),
  location: z.string().optional(),
});
export type OlAuthor = z.output<typeof authorSchema>;

export const trendingSchema = z.object({
  works: lenientArray(z.object({ key: z.string() })),
});
