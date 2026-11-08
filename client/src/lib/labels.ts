/** TMDB departman ve görev kodlarının Türkçesi. Bilinmeyen kod olduğu gibi gösterilir. */

const DEPARTMENTS: Record<string, string> = {
  Acting: 'Oyuncu',
  Directing: 'Yönetmen',
  Writing: 'Senarist',
  Production: 'Yapımcı',
  Sound: 'Müzik',
  Camera: 'Görüntü yönetmeni',
  Editing: 'Kurgu',
  Art: 'Sanat yönetmeni',
  'Costume & Make-Up': 'Kostüm ve makyaj',
  'Visual Effects': 'Görsel efekt',
  Lighting: 'Işık',
  Crew: 'Ekip',
};

const JOBS: Record<string, string> = {
  Director: 'Yönetmen',
  Screenplay: 'Senaryo',
  Writer: 'Senaryo',
  Story: 'Hikâye',
  Novel: 'Roman',
  Author: 'Yazar',
  Characters: 'Karakterler',
  Producer: 'Yapımcı',
  'Executive Producer': 'Yönetici yapımcı',
  'Director of Photography': 'Görüntü yönetmeni',
  Editor: 'Kurgu',
  'Original Music Composer': 'Müzik',
  Songs: 'Şarkılar',
  Creator: 'Yaratıcı',
  Thanks: 'Teşekkür',
  Idea: 'Fikir',
};

export function departmentLabel(department: string | null): string | null {
  return department ? (DEPARTMENTS[department] ?? null) : null;
}

/**
 * Oyuncuda rol karakter adıdır ve olduğu gibi kalır; ekipte görev kodu çevrilir.
 * "Self", "Self (Archival Footage)" gibi kayıtlar kişinin kendisini oynadığı yapımlardır.
 */
export function roleLabel(role: string): string {
  if (/^self\b/i.test(role)) return 'Kendisi';
  return JOBS[role] ?? role;
}
