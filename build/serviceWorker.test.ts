import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CACHE_PREFIX, contentVersion, listFiles, serviceWorkerSource } from './serviceWorker';

function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'kb-sw-'));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

describe('Service Worker', () => {
  it('listet alle Dateien relativ und sortiert', () => {
    const dir = fixture({ 'index.html': 'x', 'assets/app.js': 'y', 'icons/a.png': 'z' });
    expect(listFiles(dir)).toEqual(['assets/app.js', 'icons/a.png', 'index.html']);
  });

  it('ändert die Version, wenn sich ein Inhalt ändert', () => {
    const a = fixture({ 'index.html': 'eins' });
    const b = fixture({ 'index.html': 'zwei' });
    expect(contentVersion(a, ['index.html'])).not.toBe(contentVersion(b, ['index.html']));
    expect(contentVersion(a, ['index.html'])).toBe(contentVersion(a, ['index.html']));
  });

  it('nimmt Startseite und alle Dateien in den Cache', () => {
    const source = serviceWorkerSource(['index.html', 'assets/app.js'], 'abc');
    expect(source).toContain(`"${CACHE_PREFIX}abc"`);
    expect(source).toContain('["./","./index.html","./assets/app.js"]');
  });

  it('erzeugt gültiges JavaScript', () => {
    expect(() => new Function(serviceWorkerSource(['index.html'], 'v1'))).not.toThrow();
  });
});
