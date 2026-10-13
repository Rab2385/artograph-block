import { describe, expect, it } from 'vitest';
import {
  CustomMapStore,
  decodeLayout,
  encodeLayout,
  isCustomLayoutId,
  layoutFromGrid,
  newCustomId,
  randomLayout,
  setFeature,
} from './customMaps';
import { createGrid } from './mapGrid';
import { makeLayout, STANDARD_LAYOUT, WASTELAND_LAYOUT } from './mapLayout';
import { c } from './testHelpers';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

/** Pseudo-Zufall mit festem Startwert, damit Tests stabil sind. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const sample = makeLayout({
  id: 'custom-abc',
  name: 'Robert & Co. – Karte 1',
  mountains: [c(1, 1), c(9, 9)],
  ruins: [c(0, 10), c(5, 5)],
  wasteland: [c(4, 4), c(10, 0)],
});

describe('Kodieren für Link und QR-Code', () => {
  it('Hin und zurück ergibt dieselbe Karte mit neuer Kennung', () => {
    const decoded = decodeLayout(encodeLayout(sample), 'custom-neu');
    expect(decoded).toEqual({ ...sample, id: 'custom-neu' });
  });

  it('funktioniert auch für beide Blockseiten', () => {
    for (const layout of [STANDARD_LAYOUT, WASTELAND_LAYOUT]) {
      const decoded = decodeLayout(encodeLayout(layout), 'x')!;
      expect(decoded.mountains).toEqual(layout.mountains);
      expect(decoded.ruins).toEqual(layout.ruins);
      expect(decoded.wasteland).toEqual(layout.wasteland);
    }
  });

  it('ist kurz genug für einen QR-Code und nur aus URL-sicheren Zeichen', () => {
    const code = encodeLayout(sample);
    expect(code.split('~')[0]).toHaveLength(1 + 42);
    expect(code).toMatch(/^[A-Za-z0-9_\-~%.!*'()]+$/);
  });

  it('lehnt kaputte Texte ab', () => {
    expect(decodeLayout('')).toBeNull();
    expect(decodeLayout('9AAAA~x')).toBeNull();
    expect(decodeLayout('1AAA~x')).toBeNull();
    expect(decodeLayout('1' + '!'.repeat(42) + '~x')).toBeNull();
  });

  it('gibt einer namenlosen Karte einen Namen', () => {
    const code = encodeLayout({ ...sample, name: '' });
    expect(decodeLayout(code)!.name).toBe('Geteilte Karte');
  });
});

describe('Karte aus einem Raster zurückgewinnen', () => {
  it('liefert dieselben Berge, Ruinen und Schluchtfelder', () => {
    const layout = layoutFromGrid(createGrid(WASTELAND_LAYOUT), { id: 'wasteland', name: 'B' });
    expect(layout.mountains).toEqual(WASTELAND_LAYOUT.mountains);
    expect(layout.ruins).toEqual(WASTELAND_LAYOUT.ruins);
    expect(layout.wasteland).toEqual(WASTELAND_LAYOUT.wasteland);
  });
});

describe('Editor', () => {
  it('setzt Berge, Ruinen und Schlucht und ersetzt dabei, was vorher dort war', () => {
    let layout = setFeature(sample, [c(1, 1), c(2, 2)], 'ruins');
    expect(layout.mountains).toEqual([c(9, 9)]);
    expect(layout.ruins).toEqual([c(0, 10), c(1, 1), c(2, 2), c(5, 5)]);
    layout = setFeature(layout, [c(2, 2)], 'wasteland');
    expect(layout.ruins).toEqual([c(0, 10), c(1, 1), c(5, 5)]);
    expect(layout.wasteland).toEqual([c(2, 2), c(4, 4), c(10, 0)]);
    layout = setFeature(layout, [c(2, 2), c(9, 9)], 'free');
    expect(layout.mountains).toEqual([]);
    expect(layout.wasteland).toEqual([c(4, 4), c(10, 0)]);
  });

  it('liefert dieselbe Karte, wenn sich nichts ändert', () => {
    expect(setFeature(sample, [c(1, 1)], 'mountain')).toBe(sample);
  });
});

describe('Zufällige Karte', () => {
  it('5 Berge nicht am Rand, 6 Ruinen, nichts doppelt und nichts berührt sich', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const layout = randomLayout('Zufall', seeded(seed));
      expect(layout.mountains).toHaveLength(5);
      expect(layout.ruins).toHaveLength(6);
      for (const m of layout.mountains) {
        expect(m.row).toBeGreaterThan(0);
        expect(m.row).toBeLessThan(10);
        expect(m.column).toBeGreaterThan(0);
        expect(m.column).toBeLessThan(10);
      }
      const all = [...layout.mountains, ...layout.ruins];
      expect(new Set(all.map((x) => `${x.row},${x.column}`)).size).toBe(11);
      for (const group of [layout.mountains, layout.ruins]) {
        for (const a of group) {
          for (const b of group) {
            if (a === b) continue;
            expect(Math.max(Math.abs(a.row - b.row), Math.abs(a.column - b.column))).toBeGreaterThan(1);
          }
        }
      }
    }
  });
});

describe('Gespeicherte eigene Karten', () => {
  it('speichert, listet und löscht', () => {
    const store = new CustomMapStore(memoryStorage());
    expect(store.list()).toEqual([]);
    store.add(sample);
    store.add({ ...sample, id: 'custom-zwei', name: 'Zwei' });
    expect(store.list().map((l) => l.name)).toEqual(['Robert & Co. – Karte 1', 'Zwei']);
    expect(store.get('custom-zwei')?.name).toBe('Zwei');
    store.remove('custom-abc');
    expect(store.list().map((l) => l.id)).toEqual(['custom-zwei']);
  });

  it('überschreibt keine vorhandene Karte (gespeicherte Karten sind fest)', () => {
    const store = new CustomMapStore(memoryStorage());
    store.add(sample);
    store.add({ ...sample, name: 'Geändert' });
    expect(store.list()).toHaveLength(1);
    expect(store.get(sample.id)?.name).toBe(sample.name);
  });

  it('erkennt dieselbe Karte, z. B. wenn ein Link zweimal geöffnet wird', () => {
    const store = new CustomMapStore(memoryStorage());
    store.add(sample);
    expect(store.findSame({ ...sample, id: 'custom-anders' })?.id).toBe(sample.id);
    expect(store.findSame({ ...sample, mountains: [] })).toBeUndefined();
  });

  it('übersteht kaputte Daten', () => {
    const storage = memoryStorage();
    const store = new CustomMapStore(storage);
    storage.setItem(store.key, '{kaputt');
    expect(store.list()).toEqual([]);
  });

  it('Kennungen sind als eigene Karten erkennbar', () => {
    expect(isCustomLayoutId(newCustomId())).toBe(true);
    expect(isCustomLayoutId('standard')).toBe(false);
  });
});
