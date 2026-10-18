import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Standalone build: everything (JS + CSS) inlined into ONE index.html
// Output: dist-single/index.html  (double-click to play, no server needed)
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    outDir: 'dist-single',
    target: 'es2018',
    chunkSizeWarningLimit: 5000,
  },
});
