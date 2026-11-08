import type { PersonRole } from './content';

/**
 * TMDB departman ve görev kodlarının Türkçesi. TMDB'de 900'den fazla görev var; sık görülenler
 * sözlükte, gerisi departmanın adıyla gösterilir ("Visual Effects Camera" → "Görsel efekt ekibi").
 */

/** Kişinin en çok bilindiği alan (künyede: "Yönetmen · Doğum: ..."). */
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

/** Sözlükte olmayan görevin yerine: görev değil, çalıştığı ekip yazılır. */
const DEPARTMENT_TEAMS: Record<string, string> = {
  Directing: 'Yönetmenlik ekibi',
  Writing: 'Senaryo ekibi',
  Production: 'Yapım ekibi',
  Sound: 'Ses ve müzik ekibi',
  Camera: 'Kamera ekibi',
  Editing: 'Kurgu ekibi',
  Art: 'Sanat ekibi',
  'Costume & Make-Up': 'Kostüm ve makyaj ekibi',
  'Visual Effects': 'Görsel efekt ekibi',
  Lighting: 'Işık ekibi',
  Crew: 'Ekip',
};

const JOBS: Record<string, string> = {
  // Yönetmenlik
  Director: 'Yönetmen',
  'Co-Director': 'Ortak yönetmen',
  'Assistant Director': 'Yönetmen yardımcısı',
  'First Assistant Director': 'Birinci yönetmen yardımcısı',
  'Second Unit Director': 'İkinci ekip yönetmeni',
  // Senaryo
  Screenplay: 'Senaryo',
  Writer: 'Senaryo',
  Teleplay: 'Senaryo',
  Story: 'Hikâye',
  'Original Story': 'Özgün hikâye',
  'Original Concept': 'Özgün fikir',
  'Original Film Writer': 'Özgün film senaryosu',
  'Additional Writing': 'Ek senaryo',
  'Additional Dialogue': 'Ek diyalog',
  Novel: 'Roman',
  Book: 'Kitap',
  'Short Story': 'Öykü',
  'Comic Book': 'Çizgi roman',
  Author: 'Yazar',
  Characters: 'Karakterler',
  Creator: 'Yaratıcı',
  Idea: 'Fikir',
  // Yapım
  Producer: 'Yapımcı',
  'Executive Producer': 'Yönetici yapımcı',
  'Co-Producer': 'Ortak yapımcı',
  'Co-Executive Producer': 'Ortak yönetici yapımcı',
  'Associate Producer': 'Yardımcı yapımcı',
  'Consulting Producer': 'Danışman yapımcı',
  'Line Producer': 'Uygulayıcı yapımcı',
  Casting: 'Oyuncu seçimi',
  'Casting Director': 'Oyuncu seçimi',
  'Production Manager': 'Yapım müdürü',
  'Production Supervisor': 'Yapım sorumlusu',
  'Production Assistant': 'Yapım asistanı',
  // Kamera, kurgu, ışık
  'Director of Photography': 'Görüntü yönetmeni',
  Cinematography: 'Görüntü yönetmeni',
  'Camera Operator': 'Kamera operatörü',
  '"A" Camera Operator': 'Kamera operatörü',
  'Still Photographer': 'Set fotoğrafçısı',
  Editor: 'Kurgu',
  'Post Production Supervisor': 'Post prodüksiyon sorumlusu',
  Gaffer: 'Işık şefi',
  // Ses ve müzik
  'Original Music Composer': 'Müzik',
  Music: 'Müzik',
  'Main Title Theme Composer': 'Jenerik müziği',
  'Additional Music': 'Ek müzik',
  'Music Producer': 'Müzik yapımcısı',
  'Executive Music Producer': 'Yönetici müzik yapımcısı',
  'Music Score Producer': 'Müzik yapımcısı',
  'Music Supervisor': 'Müzik sorumlusu',
  'Music Arranger': 'Müzik düzenlemesi',
  Orchestrator: 'Orkestrasyon',
  Conductor: 'Orkestra şefi',
  Musician: 'Müzisyen',
  Vocals: 'Vokal',
  Songs: 'Şarkılar',
  'Theme Song Performance': 'Jenerik şarkısı',
  'Sound Designer': 'Ses tasarımı',
  'Sound Effects Editor': 'Ses efektleri kurgusu',
  // Sanat, kostüm, efekt
  'Production Design': 'Yapım tasarımı',
  'Production Designer': 'Yapım tasarımı',
  'Art Direction': 'Sanat yönetmeni',
  'Set Decoration': 'Set dekorasyonu',
  'Set Designer': 'Set tasarımcısı',
  Decorator: 'Dekoratör',
  'Costume Design': 'Kostüm tasarımı',
  'Costume Designer': 'Kostüm tasarımı',
  'Makeup Artist': 'Makyaj',
  'Visual Effects Supervisor': 'Görsel efekt sorumlusu',
  'Title Designer': 'Jenerik tasarımı',
  Stunts: 'Dublör',
  'Stunt Coordinator': 'Dublör koordinatörü',
  // Diğer
  Presenter: 'Sunucu',
  Narrator: 'Anlatıcı',
  Thanks: 'Teşekkür',
  'In Memory Of': 'Anısına',
};

/** Karakter adlarındaki TMDB notları: "Sykes (voice)" → "Sykes (seslendirme)" */
const CHARACTER_NOTES: [RegExp, string][] = [
  [/\(voice\)/gi, '(seslendirme)'],
  [/\(uncredited\)/gi, '(jenerikte adı yok)'],
  [/\(archive footage\)/gi, '(arşiv görüntüsü)'],
];

export function departmentLabel(department: string | null): string | null {
  return department ? (DEPARTMENTS[department] ?? null) : null;
}

/**
 * "Self", "Self (Archival Footage)", "Self - Director" gibi kayıtlar kişinin kendisi olarak
 * göründüğü yapımlardır. TMDB verisinde "Selft" yazım hatası da geçiyor.
 */
const SELF_ROLE = /^(self|selft|himself|herself|themselves)\b/i;
const MINOR_ROLE = /^thanks$|archiv/i;

/** Oyuncuda karakter adı korunur (notları çevrilir); ekipte görev çevrilir, bilinmiyorsa ekibi yazılır. */
export function roleLabel(role: PersonRole): string {
  if (SELF_ROLE.test(role.name)) return 'Kendisi';
  if (role.department === null) {
    return CHARACTER_NOTES.reduce((name, [note, tr]) => name.replace(note, tr), role.name);
  }
  return JOBS[role.name] ?? DEPARTMENT_TEAMS[role.department] ?? 'Ekip';
}

/**
 * Kişinin yalnızca kendisi olarak, arşiv görüntüsüyle ya da teşekkür listesinde yer aldığı kayıt.
 * Filmografide asıl işlerin arkasına alınır: Nolan'ın son 25 kaydının çoğu bu türden.
 */
export function isMinorCredit(roles: PersonRole[]): boolean {
  return (
    roles.length > 0 && roles.every(({ name }) => SELF_ROLE.test(name) || MINOR_ROLE.test(name))
  );
}
