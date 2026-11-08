// Vercel Function: Express API'si tek fonksiyon olarak çalışır. vercel.json /api/* isteklerini
// buraya yönlendirir; Express özgün adresi (/api/movies/...) görür.
//
// Derlenmiş sunucu kodunu kullanır (`npm run build` → server/dist). Kaynak TypeScript'i Vercel'in
// ayrıca derlemesine gerek kalmaz; yerelde ve testlerde çalışan kodun aynısı yayınlanır.
import { createApp } from '../server/dist/app.js';

export default createApp();
