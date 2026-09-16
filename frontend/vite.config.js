import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  server: {
    port: 3000,
    open: false,
    host: true,
    proxy: {
      '/api/animesalt-stream': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/api/netmirror': {
        target: 'https://net27.cc',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/netmirror/, '/api/embed-tmdb'),
        headers: {
          'Referer': 'https://videodownloader.site/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    }
  }
});
