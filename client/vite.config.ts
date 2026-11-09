/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Geliştirmede /api isteklerini Express'e yönlendir. Tarayıcı açısından client ve API
    // aynı adreste (same-origin) olur: CORS gerekmez, cookie'ler sorunsuz çalışır.
    // Canlıda (Vercel) aynı yapı rewrite ile kurulur.
    proxy: {
      // `changeOrigin: false`: Host başlığı tarayıcının gördüğü adres (localhost:5173) kalır.
      // Vite'ın kısa yazımı onu hedefe (5000) çevirir; o zaman sunucudaki köken kontrolü
      // (middleware/same-origin.ts) tarayıcıdan gelen her POST'u başka siteden sanıp reddeder.
      '/api': { target: 'http://localhost:5000', changeOrigin: false },
    },
  },
  test: {
    // Bileşen testleri sahte bir tarayıcıda (jsdom) çalışır; saf fonksiyon testleri de etkilenmez.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
