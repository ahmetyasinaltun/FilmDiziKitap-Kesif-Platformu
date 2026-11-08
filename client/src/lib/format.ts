const ratingFormat = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const compactFormat = new Intl.NumberFormat('tr-TR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** 8.5 → "8,5" */
export const formatRating = (value: number) => ratingFormat.format(value);

const dateFormat = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "1970-07-30" → "30 Temmuz 1970". Saat dilimi yüzünden bir gün kaymasın diye UTC. */
export const formatDate = (isoDate: string) => dateFormat.format(new Date(`${isoDate}T00:00:00Z`));

/** "30 July 1818" → 1818. Open Library tarihleri serbest İngilizce metin; güvenilir olan yıl. */
export function yearIn(text: string | null): number | null {
  const match = text?.match(/\b(\d{3,4})\b(?!.*\b\d{3,4}\b)/);
  return match ? Number(match[1]) : null;
}

/** 1200817 → "1,2 Mn" */
export const formatCount = (value: number) => compactFormat.format(value);
