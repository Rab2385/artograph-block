import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';

export const SW_FILE = 'sw.js';
export const CACHE_PREFIX = 'kartograph-block-';

/**
 * Quelltext des Service Workers.
 *
 * - Beim Installieren landen alle Dateien der App im Cache, damit sie offline startet.
 * - Seitenaufrufe gehen zuerst ans Netz (damit Updates ankommen) und fallen offline
 *   auf die gespeicherte Seite zurück.
 * - Alle anderen Dateien haben einen Hash im Namen und kommen direkt aus dem Cache.
 */
export function serviceWorkerSource(files: readonly string[], version: string): string {
  return `// Automatisch erzeugt von build/serviceWorker.ts – nicht von Hand ändern.
const CACHE = ${JSON.stringify(CACHE_PREFIX + version)};
const FILES = ${JSON.stringify(['./', ...files.map((f) => './' + f)])};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(${JSON.stringify(CACHE_PREFIX)}) && key !== CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('./', copy));
          return response;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
`;
}

/** Alle Dateien unter `dir`, relativ und mit `/` getrennt, sortiert. */
export function listFiles(dir: string): string[] {
  const result: string[] = [];
  const walk = (current: string) => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) walk(path);
      else result.push(relative(dir, path).split(sep).join('/'));
    }
  };
  walk(dir);
  return result.sort();
}

/** Version aus dem Inhalt aller Dateien: ändert sich etwas, gibt es einen neuen Cache. */
export function contentVersion(dir: string, files: readonly string[]): string {
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update(readFileSync(join(dir, file)));
  }
  return hash.digest('hex').slice(0, 12);
}

/** Vite-Plugin: schreibt nach dem Build `sw.js` mit der Liste aller erzeugten Dateien. */
export function serviceWorkerPlugin(): Plugin {
  let outDir = 'dist';
  return {
    name: 'kartograph-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    closeBundle() {
      const files = listFiles(outDir).filter((f) => f !== SW_FILE);
      writeFileSync(join(outDir, SW_FILE), serviceWorkerSource(files, contentVersion(outDir, files)));
    },
  };
}
