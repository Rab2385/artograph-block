import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative Pfade, damit die Seite auch unter /artograph-block/ (GitHub Pages) läuft.
  base: './',
  test: {
    include: ['src/**/*.test.ts'],
  },
});
