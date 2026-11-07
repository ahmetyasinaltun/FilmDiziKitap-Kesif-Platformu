/**
 * Girişten sonra dönülecek adres. Değer adresten geldiği için güvenilmez: "//kotu-site.com" ya da
 * "https://..." kabul edilseydi bağlantıya tıklayan kullanıcı başka siteye yönlendirilebilirdi.
 */
export function safeNextPath(value: string | null, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }
  return value;
}
