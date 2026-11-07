/** Ürün adı tek yerde: ad değişirse sadece burası ve index.html güncellenir. */
export const BRAND_NAME = 'Suare';

export const pageTitle = (title?: string) => (title ? `${title} · ${BRAND_NAME}` : BRAND_NAME);
