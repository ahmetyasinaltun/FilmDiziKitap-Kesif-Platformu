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
      '/api': 'http://localhost:5000',
    },
  },
});
