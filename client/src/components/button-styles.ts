const base =
  'pressable flex h-12 cursor-pointer items-center rounded-full px-6 font-bold sm:h-[3.375rem] sm:px-7 sm:text-lg';

/** Ekranda en fazla bir tane: film rengi zemin. */
export const filmButton = `${base} bg-film text-film-ink hover:brightness-110 disabled:cursor-default disabled:opacity-60`;

export const quietButton = `${base} bg-light/10 text-light shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-light/15`;
