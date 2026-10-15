import { compare, hash, truncates } from 'bcryptjs';

/**
 * bcrypt maliyeti: 2^12 tur. Geliştirme makinesinde hash ~210 ms sürüyor; bir saldırganın
 * sızmış bir hash'e karşı saniyede deneyebileceği şifre sayısını bu süre belirler.
 * Her +1, süreyi iki katına çıkarır.
 */
const COST = 12;

/**
 * Kullanıcı bulunamadığında da bir karşılaştırma yapılır; yoksa "bu e-posta kayıtlı mı?"
 * sorusunun cevabı yanıt süresinden anlaşılabilir (kayıtlı: ~210 ms, değil: ~1 ms).
 * Aynı maliyetle üretilmiş, hiçbir hesaba ait olmayan bir hash.
 */
const DUMMY_HASH = '$2b$12$tg4lwMBMUe0af1axz0.ReuF9xQRiun9zVKKqePNGHVX9lfQ8HEw5.';

export function hashPassword(password: string): Promise<string> {
  return hash(password, COST);
}

/** `passwordHash` null ise (kullanıcı yok) aynı süreyi harcar ama her zaman `false` döner. */
export async function verifyPassword(password: string, passwordHash: string | null) {
  const matches = await compare(password, passwordHash ?? DUMMY_HASH);
  return passwordHash !== null && matches;
}

/**
 * bcrypt şifrenin ilk 72 baytını kullanır, gerisini sessizce yok sayar. Türkçe harfler
 * UTF-8'de 2 bayt olduğundan sınır karakterle değil baytla kontrol edilir.
 */
export function isPasswordTooLong(password: string): boolean {
  return truncates(password);
}
