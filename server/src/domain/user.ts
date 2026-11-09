/** Oturumdaki kullanıcı: kendi bilgileri (e-posta dahil). Şifre hash'i asla dışarı çıkmaz. */
export interface SessionUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  /** false ise hesap kütüphaneye kayıt yapamaz; doğrulama bağlantısı e-postayla gelir. */
  emailVerified: boolean;
}
