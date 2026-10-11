import { defineConfig } from 'vitest/config';
import { serviceWorkerPlugin } from './build/serviceWorker';

export default defineConfig({
  // Relative Pfade, damit die Seite auch unter /artograph-block/ (GitHub Pages) läuft.
  base: './',
  plugins: [serviceWorkerPlugin()],
  test: {
    include: ['src/**/*.test.ts', 'build/**/*.test.ts'],
  },
});
