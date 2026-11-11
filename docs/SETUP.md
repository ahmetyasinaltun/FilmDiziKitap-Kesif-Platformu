# Kurulum Rehberi

Projeyi çalıştırmak için gereken hesaplar, API anahtarları ve ortam değişkenleri. Tüm servisler **ücretsiz** ve hiçbiri kredi kartı istemiyor.

> **Güvenlik kuralları**
> - Anahtarlar yalnızca `server/.env` dosyasına yazılır. Bu dosya git'e girmez (`.gitignore`).
> - Anahtarları sohbete, issue'ya, ekran görüntüsüne veya koda yapıştırma.
> - Bir anahtar yanlışlıkla paylaşılırsa, ilgili servisten hemen yenisini oluştur ve eskisini sil.

## Genel bakış

| # | Servis | Ne için | Env değişkeni | Gerekli mi |
|---|---|---|---|---|
| 1 | TMDB | Film, dizi, kişi verisi | `TMDB_API_TOKEN` | Evet |
| 2 | OMDb | IMDb, Rotten Tomatoes, Metacritic puanları | `OMDB_API_KEY` | Evet |
| 3 | Google Books | Kitapların Türkçe açıklaması (destek) | `GOOGLE_BOOKS_API_KEY` | Evet (anahtarsız istek kota hatası verir) |
| 4 | Neon | PostgreSQL veritabanı | `DATABASE_URL`, `DIRECT_URL` | Evet |
| 5 | Vercel | Yayın | Yok (GitHub bağlantısı) | Yalnız yayınlamak için |
| 6 | Brevo | Kayıtta e-posta doğrulama bağlantısı | `BREVO_API_KEY`, `MAIL_FROM`, `APP_URL` | Canlıda evet, geliştirmede isteğe bağlı |
| – | Open Library | Kitapların ana kaynağı: arama, detay, kapak, yazar, trend | `APP_USER_AGENT` | Anahtar gerekmez |
| – | Vikipedi / Wikidata | Kitapların Türkçe açıklaması | `APP_USER_AGENT` | Anahtar gerekmez |

## 0. `.env` dosyası

`server/.env` dosyası `server/.env.example` şablonundan oluşturulur. Her adımda aldığın değeri ilgili satırda `=` işaretinden sonra, tırnak ve boşluk olmadan yaz:

```
TMDB_API_TOKEN=eyJhbGciOi...
```

`JWT_SECRET` için rastgele uzun bir değer gerekir. Şu komutla üretilebilir:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 1. TMDB

1. [themoviedb.org/signup](https://www.themoviedb.org/signup) adresinden hesap aç ve e-postanı doğrula.
2. Profil menüsü → **Settings** → soldaki **API** sekmesi.
3. API anahtarı iste (**Create** / **Request an API Key**). Kullanım türü: **Developer**. Kullanım şartlarını kabul et.
4. Formu doldur:
   - Type of use: kişisel/eğitim (Personal / Educational)
   - Application name: `Sosyal Kutuphane Platformu`
   - Application URL: GitHub repo adresi (ya da şimdilik `http://localhost:5173`)
   - Application summary: "Film, dizi ve kitapları keşfetme ve takip etme için ticari olmayan bir portfolyo projesi."
5. Onaydan sonra aynı sayfada iki değer görünür. **API Read Access Token** olanı (uzun, `eyJ` ile başlayan) kopyala → `TMDB_API_TOKEN`.
   *Kısa olan "API Key" değerine gerek yok.*

## 2. OMDb

1. [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx) adresinde **FREE (1,000 daily limit)** seç.
2. E-posta, ad ve kısa bir kullanım açıklaması gir, gönder.
3. Gelen e-postadaki **aktivasyon linkine tıkla** (tıklanmazsa anahtar çalışmaz).
4. E-postadaki anahtar → `OMDB_API_KEY`.

## 3. Google Books

1. [console.cloud.google.com](https://console.cloud.google.com) adresine Google hesabınla gir. İlk girişte kullanım şartlarını kabul et (ödeme bilgisi gerekmiyor).
2. Üstteki proje seçici → **New Project** → ad: `film-dizi-kitap` → **Create**. Yeni projenin seçili olduğundan emin ol.
3. Menü → **APIs & Services** → **Library** → "Books API" ara → **Enable**.
4. **APIs & Services** → **Credentials** → **Create credentials** → **API key**.
5. Oluşan anahtarda **Edit API key** (veya "Restrict key") → **API restrictions** → **Restrict key** → yalnızca **Books API** seç → **Save**. Böylece anahtar sızsa bile başka bir Google servisi için kullanılamaz.
6. Anahtar → `GOOGLE_BOOKS_API_KEY`.

## 4. Neon (PostgreSQL)

1. [neon.tech](https://neon.tech) → **Sign up** → **GitHub ile devam et**.
2. Yeni proje oluştur:
   - Project name: `film-dizi-kitap`
   - Postgres sürümü: varsayılan
   - Region: **AWS Europe (Frankfurt)**, Türkiye'ye en yakın bölge
3. Proje panelinde **Connect** düğmesi → bağlantı adresi (`postgresql://...` ile başlar):
   - **Connection pooling açık** iken görünen adres (`-pooler` içerir) → `DATABASE_URL`
   - **Connection pooling kapalı** iken görünen adres → `DIRECT_URL` (veritabanı şeması güncellemeleri için)
   - Her iki adreste `sslmode=require` kısmını `sslmode=verify-full` yap. Kullandığımız `pg` sürücüsü zaten böyle davranıyor; açıkça yazınca uyarı vermiyor.
4. Geliştirme için ayrı bir dal oluştur: **Branches** → **Create branch** → ad: `dev`. Geliştirme sırasında `.env`'deki adresler bu `dev` dalından alınır. `main` dal canlı site için ayrılır.
   *Not: Her dalın kendi bağlantı adresi var. Connect penceresinde dal seçicisinden `dev`'i seçmeyi unutma.*

## 5. Vercel

Yapılandırma depoda hazır: `vercel.json` derlemeyi, `/api` yönlendirmesini, tek sayfa uygulama yönlendirmesini (bilinmeyen adresler `index.html`'e), Frankfurt bölgesini ve dosya önbelleğini tanımlar. `api/index.js` Express API'sini tek bir Vercel Function olarak çalıştırır.

**Hesap**

1. [vercel.com/signup](https://vercel.com/signup) → **Hobby** planı (ücretsiz, kredi kartı istemez) → **Continue with GitHub**.
2. GitHub depo erişimi sorulursa **Only select repositories** → yalnızca bu depo.

**Canlı ortam değişkenleri** (`server/.env.production`, git'e girmez)

3. Dosya hazırdır: `NODE_ENV`, canlı ortama özel `JWT_SECRET` ve API anahtarları dolu. Eksik olan iki veritabanı adresi: Neon → **Connect** → dal seçicisinde **main**:
   - **Connection pooling açık** iken görünen adres → `DATABASE_URL`
   - **Connection pooling kapalı** iken görünen adres → `DIRECT_URL`
   - İkisinde de `sslmode=require` kısmını `sslmode=verify-full` yap.
4. Bağlantıları dene (değerler ekrana yazılmaz):
   - Git Bash: `ENV_FILE=.env.production npm run check:env -w server`
   - PowerShell: `$env:ENV_FILE='.env.production'; npm run check:env -w server; Remove-Item Env:ENV_FILE`
5. Canlı veritabanına şemayı uygula (tabloları oluşturur): aynı yöntemle `npm run db:deploy -w server`.

**Proje**

6. [vercel.com/new](https://vercel.com/new) → depoyu seç → **Import**:
   - **Application Preset:** `Other`. "Services" değil: o özellik Beta, npm workspaces ile kurulumu ve tek sayfa uygulama yönlendirmesi belgelenmemiş.
   - **Root Directory:** `./`
   - Build ve output ayarlarına dokunma; `vercel.json`'dan gelir.
   - **Environment Variables:** `server/.env.production` dosyasının içeriğini kopyalayıp ilk kutuya yapıştır; Vercel satırları kendisi ayırır.
7. **Deploy.** İlk yayın doğrudan canlı (production) olur; adres `<proje-adı>.vercel.app`.

## 6. Brevo (e-posta doğrulama)

Kayıt olan kullanıcıya doğrulama bağlantısı gönderir. Ücretsiz plan günde 300 e-posta, kredi kartı istemez, alan adı gerektirmez.

**Geliştirmede isteğe bağlı:** `BREVO_API_KEY` ve `MAIL_FROM` boşsa e-posta gönderilmez, bağlantı `npm run dev` terminaline yazılır. Canlıda ikisi de zorunlu; eksikse sunucu açılmaz.

1. Gönderen olarak kullanılacak bir e-posta adresi (ör. yeni bir Gmail). Kayıt olan herkes bu adresi "Kimden" satırında görür; kişisel adres kullanma.
2. [brevo.com](https://www.brevo.com) → **Sign up free** → ücretsiz plan.
3. **Settings** → **Senders, domains, IPs** → **Senders** sekmesi → **Add sender**: ad `Film Dizi Kitap`, adres 1. maddedeki. Brevo bu adrese bir onay e-postası gönderir; içindeki bağlantıya tıkla ya da kodu gir. (**Domains** sekmesi kendi alan adın içindir; `gmail.com` oraya eklenmez.)
4. **SMTP & API** → **API Keys** → **Generate a new API key**. İzin seçimi sorulursa yalnızca işlemsel e-posta (transactional) gönderme izni yeterli: anahtar sızsa bile hesap ayarları okunamaz. Anahtar bir kez gösterilir; doğrudan dosyaya yapıştır, sohbete ya da başka bir yere yazma.
   - **Settings** → **Security** → **Authorized IPs** → **Deactivate blocking**. Brevo, anahtar 30 gün yeni bir adresten kullanılmazsa tanımadığı IP adreslerini engellemeye başlar. Vercel fonksiyonlarının IP adresi sabit değil; engelleme açık kalırsa e-postalar bir gün sessizce durur (Brevo 401 döner). Anahtar yalnızca sunucuda durduğu için bu açık kabul edilebilir.
5. `server/.env` ve `server/.env.production` içinde:
   - `BREVO_API_KEY=` → anahtar
   - `MAIL_FROM=` → gönderen adresi
   - `APP_URL`: geliştirmede `http://localhost:5173`, canlıda sitenin adresi (doğrulama bağlantısı bu adresle başlar).
6. `npm run check:env -w server` Brevo satırında ✓ göstermeli. Kontrol e-posta göndermez: anahtarın gönderme yetkisini boş bir istekle dener. Anahtarın hesap izni varsa gönderenin onaylı olduğunu da kontrol eder ("gönderen onaylı"); yalnız e-posta izinli anahtarda bunu Brevo panelinden (Senders) kontrol et.
7. Canlı için Vercel → proje → **Settings** → **Environment Variables**: `BREVO_API_KEY`, `MAIL_FROM`, `APP_URL` eklenir. Bu değişkenler eklenmeden yayınlanan sürüm açılmaz (canlıda zorunlu oldukları için); önce değişkenler, sonra yayın.

**Gmail ile gönderimin sınırı:** gmail.com gibi ücretsiz adresler Brevo'da doğrulanamaz (DKIM, DMARC). Brevo bu yüzden gönderen adresini kendi alan adıyla değiştirir (`...@...brevosend.com` benzeri); gönderen adı "Film Dizi Kitap" olarak kalır. E-postalar gereksiz klasörüne düşebilir. Bir demo için yeterli, arayüz de kullanıcıya gereksiz klasörüne bakmasını söylüyor. Kalıcı çözüm kendi alan adı ve Brevo'da alan adı doğrulaması; alan adı ücretli olduğu için yapılmadı.

## 7. Kontrol

Değerleri `.env`'ye yazdıktan sonra kök dizinde:

```bash
npm install
npm run check:env -w server
```

Komut önce biçimi (eksik/hatalı değişken) kontrol eder, sonra her servise gerçek bir istek atar. Hiçbir değeri ekrana basmaz. Örnek çıktı:

```
✓ Biçim: tüm değişkenler mevcut ve geçerli

✓ Neon (DATABASE_URL, pooled) (PostgreSQL 18.0)
✓ Neon (DIRECT_URL, migration) (PostgreSQL 18.0)
✓ TMDB
✓ OMDb
✓ Google Books
✓ Open Library
✓ Brevo (e-posta) (gönderebiliyor; gönderen onayını Brevo panelinden kontrol et)
✓ Vikipedi
```

`!` işareti zorunlu olmayan bir servisin (Google Books, Vikipedi) o an erişilemediğini ya da geliştirmede boş bırakılan Brevo'yu gösterir; uygulama yine çalışır. Google Books'un arama altyapısı sık sık `503` veriyor (Google tarafındaki bir sorun); bu durumda `!` görmek normal.

| Hata | Anlamı | Çözüm |
|---|---|---|
| `28P01` | Veritabanı şifresi reddedildi | Neon → Connect → doğru dalı (`dev`) seç, şifreyi göster ya da Roles'tan sıfırla, adresi yeniden kopyala |
| `HTTP 401` | API anahtarı geçersiz | İlgili bölümdeki adımlarla anahtarı yeniden al |
| `HTTP 503` / zaman aşımı | Servis o an yanıt vermiyor | Birkaç dakika sonra tekrar dene |

Kontrol geçince veritabanı tablolarını oluştur:

```bash
npm run db:migrate -w server
```

Ardından `npm run dev` ile uygulamayı başlat: http://localhost:5173
