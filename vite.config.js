import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standard multi-file build -> dist/ (deploy this folder to Netlify)
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2018',
    chunkSizeWarningLimit: 1200,
  },
  server: { host: true, port: 5173 },
});
