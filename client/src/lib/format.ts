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

/** 1200817 → "1,2 Mn" */
export const formatCount = (value: number) => compactFormat.format(value);
