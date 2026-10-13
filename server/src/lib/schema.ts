import { z } from 'zod';

/**
 * Dış kaynak listeleri için hoşgörülü dizi: biçimi bozuk öğeler atlanır,
 * tek bir hatalı öğe bütün yanıtı geçersiz kılmaz.
 */
export function lenientArray<S extends z.ZodType>(item: S) {
  return z.array(z.unknown()).transform((values) =>
    values.flatMap((value) => {
      const parsed = item.safeParse(value);
      return parsed.success ? [parsed.data] : [];
    }),
  );
}

/** Görünmez yön ve biçim karakterleri (örn. TMDB'deki "Ofis" başlığının iki yanındaki U+200E); arayüzü ve aramayı bozar. */
const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

function clean(value: string): string {
  return value.replace(INVISIBLE_CHARS, '').trim();
}

/** Zorunlu metin (başlık, isim), temizlenmiş. */
export const text = z.string().transform(clean);

/** Kaynaklar boş değeri bazen "", bazen null, bazen hiç göndermez. Hepsi null olur. */
export const optionalText = z
  .string()
  .nullish()
  .transform((value) => (value ? clean(value) || null : null));
