const base =
  'pressable flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-6 font-bold sm:h-[3.375rem] sm:px-7 sm:text-lg';

/** Ekranda en fazla bir tane: film rengi zemin. */
export const filmButton = `${base} bg-film text-film-ink hover:brightness-110 disabled:cursor-default disabled:opacity-60`;

export const quietButton = `${base} bg-light/10 text-light shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-light/15 disabled:cursor-default disabled:opacity-60`;

/** Mesajın yanındaki küçük ikincil düğme: "Tekrar dene", "Bağlantıyı tekrar gönder". */
export const smallQuietButton =
  'pressable h-11 cursor-pointer rounded-full bg-light/10 px-5 font-medium text-light hover:bg-light/15 disabled:cursor-default disabled:opacity-60';

/** Seçili durum: kaydedildiğini gösterir. */
export const activeButton = `${base} bg-light text-room hover:bg-light/90`;

/** Sonuç ve kütüphane ızgarası */
export const posterGrid =
  'grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-4 lg:grid-cols-6 lg:gap-x-5';

/** Sekme ve süzgeç bağlantıları */
export const pillLink = (selected: boolean) =>
  `pressable flex h-11 items-center rounded-full px-4 font-medium ${
    selected ? 'bg-light text-room' : 'text-light-dim hover:text-light'
  }`;
