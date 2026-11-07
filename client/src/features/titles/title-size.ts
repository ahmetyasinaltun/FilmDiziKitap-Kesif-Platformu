/**
 * Vitrinde başlık tek satır ve sabit yükseklikte. Uzun başlık iki satıra insaydı alttaki sıra
 * kayar, fare başka afişin üstünde kalır ve seçim kendiliğinden değişirdi.
 */
export function vitrinTitleSize(title: string): string {
  if (title.length <= 15) return 'text-[2.5rem] sm:text-[3.5rem] lg:text-[3.75rem]';
  if (title.length <= 24) return 'text-[1.75rem] sm:text-[2.5rem] lg:text-[3rem]';
  return 'text-[1.375rem] sm:text-[2rem] lg:text-[2.25rem]';
}
