/** Migration'ların bir kez uygulandığı şablon; her test dosyası bunun bir kopyasını alır. */
export const TEMPLATE_DATABASE = 'migrated_template';

/** Aynı sunucuda başka bir veritabanının adresi. */
export function withDatabase(serverUrl: string, database: string): string {
  const url = new URL(serverUrl);
  url.pathname = `/${database}`;
  return url.toString();
}
