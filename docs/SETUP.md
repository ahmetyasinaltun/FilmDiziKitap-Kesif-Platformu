# Kurulum Rehberi

Projeyi çalıştırmak için gereken hesaplar, API anahtarları ve ortam değişkenleri. Tüm servisler **ücretsiz** ve hiçbiri kredi kartı istemiyor.

> **Güvenlik kuralları**
> - Anahtarlar yalnızca `server/.env` dosyasına yazılır. Bu dosya git'e girmez (`.gitignore`).
> - Anahtarları sohbete, issue'ya, ekran görüntüsüne veya koda yapıştırma.
> - Bir anahtar yanlışlıkla paylaşılırsa, ilgili servisten hemen yenisini oluştur ve eskisini sil.

## Genel bakış

| # | Servis | Ne için | Env değişkeni | Ne zaman gerekli |
|---|---|---|---|---|
| 1 | TMDB | Film, dizi, kişi verisi | `TMDB_API_TOKEN` | Faz 2 |
| 2 | OMDb | IMDb, Rotten Tomatoes, Metacritic puanları | `OMDB_API_KEY` | Faz 2 |
| 3 | Google Books | Kitapların Türkçe açıklaması (isteğe bağlı) | `GOOGLE_BOOKS_API_KEY` | Faz 2 |
| 4 | Neon | PostgreSQL veritabanı | `DATABASE_URL`, `DIRECT_URL` | Faz 1 |
| 5 | Vercel | Yayın | Yok (GitHub bağlantısı) | Faz 6, hesap şimdiden açılabilir |
| – | Open Library | Kitapların ana kaynağı: arama, detay, kapak, yazar, trend | `APP_USER_AGENT` | Anahtar gerekmez |
| – | Vikipedi / Wikidata | Kitapların Türkçe açıklaması | `APP_USER_AGENT` | Anahtar gerekmez |
| – | Brevo, Cloudinary | E-posta, avatar yükleme | Faz 6'da eklenecek | Faz 6 |

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
2. Üstteki proje seçici → **New Project** → ad: `sosyal-kutuphane` → **Create**. Yeni projenin seçili olduğundan emin ol.
3. Menü → **APIs & Services** → **Library** → "Books API" ara → **Enable**.
4. **APIs & Services** → **Credentials** → **Create credentials** → **API key**.
5. Oluşan anahtarda **Edit API key** (veya "Restrict key") → **API restrictions** → **Restrict key** → yalnızca **Books API** seç → **Save**. Böylece anahtar sızsa bile başka bir Google servisi için kullanılamaz.
6. Anahtar → `GOOGLE_BOOKS_API_KEY`.

## 4. Neon (PostgreSQL)

1. [neon.tech](https://neon.tech) → **Sign up** → **GitHub ile devam et**.
2. Yeni proje oluştur:
   - Project name: `sosyal-kutuphane`
   - Postgres sürümü: varsayılan
   - Region: **AWS Europe (Frankfurt)**, Türkiye'ye en yakın bölge
3. Proje panelinde **Connect** düğmesi → bağlantı adresi (`postgresql://...` ile başlar):
   - **Connection pooling açık** iken görünen adres (`-pooler` içerir) → `DATABASE_URL`
   - **Connection pooling kapalı** iken görünen adres → `DIRECT_URL` (veritabanı şeması güncellemeleri için)
   - Her iki adreste `sslmode=require` kısmını `sslmode=verify-full` yap. Kullandığımız `pg` sürücüsü zaten böyle davranıyor; açıkça yazınca uyarı vermiyor.
4. Geliştirme için ayrı bir dal oluştur: **Branches** → **Create branch** → ad: `dev`. Geliştirme sırasında `.env`'deki adresler bu `dev` dalından alınır. `main` dal canlı site için ayrılır.
   *Not: Her dalın kendi bağlantı adresi var. Connect penceresinde dal seçicisinden `dev`'i seçmeyi unutma.*

## 5. Vercel

1. [vercel.com/signup](https://vercel.com/signup) → **Hobby** planı → **GitHub ile devam et**.
2. Şimdilik başka bir şey yapma. Projeyi bağlama işi Faz 6'da.

## 6. Kontrol

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
✓ Vikipedi
```

`!` işareti zorunlu olmayan bir servisin (Google Books, Vikipedi) o an erişilemediğini gösterir; uygulama yine çalışır. Google Books'un arama altyapısı sık sık `503` veriyor (Google tarafındaki bir sorun); bu durumda `!` görmek normal.

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
