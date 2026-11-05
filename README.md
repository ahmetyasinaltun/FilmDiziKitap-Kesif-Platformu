# Sosyal Kütüphane Platformu

Film, dizi ve kitapları tek yerde keşfetmek, takip etmek ve yorumlamak için Türkçe bir sosyal platform.

> **Durum: v2 yapım aşamasında.** Proje, TypeScript ile baştan tasarlanıyor. İlk sürüm (v1) [`v1` etiketinde](../../tree/v1) duruyor. İlerleme için [PROGRESS.md](PROGRESS.md), mimari kararlar için [LEARNING.md](LEARNING.md) dosyasına bakabilirsiniz.

## v2'de hedeflenenler

- **Tek yerde film, dizi ve kitap:** birleşik arama, trendler, vizyondakiler
- **Zengin detay sayfaları:** Türkçe açıklama, fragman, oyuncu kadrosu, sezon ve bölümler, benzer içerikler
- **Puanlar bir arada:** IMDb, Rotten Tomatoes, Metacritic ve TMDB
- **Türkiye'de nerede izlenir:** yayın platformları
- **Kişisel takip:** izleyeceğim/izledim, okuyacağım/okudum, özel listeler
- **Sosyal:** puan ve yorum, takip, arkadaş akışı
- Herkese açık gezinme, mobil uyumlu ve erişilebilir arayüz

## Teknoloji

| Katman | Teknoloji |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router |
| Backend | Node.js, Express, TypeScript, Prisma, Zod |
| Veritabanı | PostgreSQL (Neon) |
| Yayın | Vercel |
| Test / CI | Vitest, GitHub Actions |

## Veri kaynakları

[TMDB](https://www.themoviedb.org/) · [OMDb](https://www.omdbapi.com/) · [Google Books](https://developers.google.com/books) · [Open Library](https://openlibrary.org/developers/api)

Bu ürün TMDB API'sini kullanır ancak TMDB tarafından onaylanmamış veya sertifikalandırılmamıştır.

## Kurulum

Gereksinim: Node.js 24+. Gerekli hesaplar, API anahtarları ve ortam değişkenleri: [docs/SETUP.md](docs/SETUP.md).

```bash
npm install                    # bağımlılıklar + Prisma client
npm run check:env -w server    # .env ve bağlantı kontrolü
npm run db:migrate -w server   # veritabanı tabloları
npm run dev                    # http://localhost:5173
```

`npm test`, `npm run lint` ve `npm run typecheck` ile kontroller çalıştırılır.
