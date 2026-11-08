/**
 * Uzun kelimelere hece sınırlarında görünmez tire (U+00AD) ekler. Tarayıcı kelimeyi satıra
 * sığdıramazsa yalnızca bu noktalardan böler ve tireyi gösterir.
 *
 * Neden: Chrome'un Windows'ta Türkçe heceleme sözlüğü yok; `hyphens: auto` işe yaramıyor ve dar
 * kartlarda "Tutunamayanla / r" gibi son harften bölünme oluyor. Türkçe heceleme kuralı düzenli:
 * her hecede tek ünlü vardır; iki ünlü arasındaki tek ünsüz sonraki heceye, birden fazla ünsüzün
 * sonuncusu sonraki heceye geçer. Yabancı adlarda kusursuz değil ama harf ortasından bölmekten iyi.
 */

const SOFT_HYPHEN = '\u00AD';
/** Bundan kısa kelimeler zaten sığar; dokunulmaz. */
const MIN_WORD_LENGTH = 10;
/** Satır başında ya da sonunda tek harf kalmasın. */
const MIN_FRAGMENT = 2;

const VOWELS = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü']);

function isVowel(letter: string): boolean {
  // "â", "ā" gibi işaretli harfler temel harfiyle değerlendirilir.
  const base = letter.normalize('NFD').charAt(0).toLocaleLowerCase('tr-TR');
  return VOWELS.has(base);
}

function hyphenateWord(word: string): string {
  const letters = [...word];
  const vowels = letters.flatMap((letter, index) => (isVowel(letter) ? [index] : []));

  const breaks = new Set<number>();
  for (let i = 0; i + 1 < vowels.length; i++) {
    const current = vowels[i] ?? 0;
    const next = vowels[i + 1] ?? 0;
    // Yan yana ünlüler ("saat") araya bölünür; ünsüz varsa sonuncusu sonraki heceye geçer.
    const at = next - current === 1 ? next : next - 1;
    if (at >= MIN_FRAGMENT && letters.length - at >= MIN_FRAGMENT) breaks.add(at);
  }

  return letters
    .map((letter, index) => (breaks.has(index) ? SOFT_HYPHEN + letter : letter))
    .join('');
}

export function softHyphenate(text: string): string {
  return text.replace(/\p{L}+/gu, (word) =>
    [...word].length < MIN_WORD_LENGTH ? word : hyphenateWord(word),
  );
}
