import { describe, expect, it } from 'vitest';
import { hashPassword, isPasswordTooLong, verifyPassword } from './password.js';

describe('password', () => {
  it('hash’lenen şifreyi doğrular, yanlış şifreyi reddeder', async () => {
    const hash = await hashPassword('dogru-sifre');

    expect(await verifyPassword('dogru-sifre', hash)).toBe(true);
    expect(await verifyPassword('yanlis-sifre', hash)).toBe(false);
  });

  it('kullanıcı yoksa, sahte hash’in şifresi yazılsa bile false döner', async () => {
    expect(await verifyPassword('zamanlama-icin-sahte-sifre', null)).toBe(false);
  });

  it('72 bayt sınırını karakterle değil baytla ölçer', () => {
    expect(isPasswordTooLong('a'.repeat(72))).toBe(false);
    expect(isPasswordTooLong('ş'.repeat(36))).toBe(false);
    expect(isPasswordTooLong('ş'.repeat(37))).toBe(true);
  });
});
