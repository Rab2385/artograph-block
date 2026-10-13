import { coord, sameCoordinate, type Coordinate } from './coordinate';
import type { KeyValueStorage } from './gameStore';
import { allCoordinates, cellAt, type MapGrid } from './mapGrid';
import { makeLayout, printedFeatureAt, type MapLayout } from './mapLayout';
import type { PrintedFeature } from './terrain';

/** Eigene Karten haben immer die Größe des Blocks (#27). */
export const CUSTOM_MAP_SIZE = 11;
export const CUSTOM_ID_PREFIX = 'custom-';
/** Anzahl auf den gedruckten Blockseiten, nur als Orientierung im Editor. */
export const TYPICAL_COUNTS = { mountains: 5, ruins: 6 } as const;

export function isCustomLayoutId(id: string): boolean {
  return id.startsWith(CUSTOM_ID_PREFIX);
}

export function newCustomId(random: () => number = Math.random): string {
  return CUSTOM_ID_PREFIX + Math.floor(random() * 36 ** 8).toString(36).padStart(8, '0');
}

// MARK: Kodieren für Link und QR-Code

const CODE_VERSION = '1';
/** 2 Bit je Feld, in dieser Reihenfolge. */
const FEATURES: readonly PrintedFeature[] = ['free', 'mountain', 'ruins', 'wasteland'];

/**
 * Kurzer Text für Link und QR-Code: Version, 121 Felder × 2 Bit als Base64url
 * (42 Zeichen), dann der Name. Beispiel: `1Aw…AA~Meine%20Karte`.
 */
export function encodeLayout(layout: MapLayout): string {
  const bytes = new Uint8Array(Math.ceil((CUSTOM_MAP_SIZE * CUSTOM_MAP_SIZE) / 4));
  for (let i = 0; i < CUSTOM_MAP_SIZE * CUSTOM_MAP_SIZE; i++) {
    const c = coord(Math.floor(i / CUSTOM_MAP_SIZE), i % CUSTOM_MAP_SIZE);
    const value = FEATURES.indexOf(printedFeatureAt(layout, c));
    bytes[i >> 2]! |= value << ((i & 3) * 2);
  }
  return CODE_VERSION + toBase64Url(bytes) + '~' + encodeURIComponent(layout.name);
}

/** Gegenstück zu `encodeLayout`; `null` bei unlesbarem Text. Die Kennung wird neu vergeben. */
export function decodeLayout(code: string, id: string = newCustomId()): MapLayout | null {
  const separator = code.indexOf('~');
  if (code[0] !== CODE_VERSION || separator < 0) return null;
  let bytes: Uint8Array;
  let name: string;
  try {
    bytes = fromBase64Url(code.slice(1, separator));
    name = decodeURIComponent(code.slice(separator + 1)).trim();
  } catch {
    return null;
  }
  if (bytes.length !== Math.ceil((CUSTOM_MAP_SIZE * CUSTOM_MAP_SIZE) / 4)) return null;
  const lists: Record<'mountains' | 'ruins' | 'wasteland', Coordinate[]> = { mountains: [], ruins: [], wasteland: [] };
  for (let i = 0; i < CUSTOM_MAP_SIZE * CUSTOM_MAP_SIZE; i++) {
    const feature = FEATURES[(bytes[i >> 2]! >> ((i & 3) * 2)) & 3]!;
    const c = coord(Math.floor(i / CUSTOM_MAP_SIZE), i % CUSTOM_MAP_SIZE);
    if (feature === 'mountain') lists.mountains.push(c);
    if (feature === 'ruins') lists.ruins.push(c);
    if (feature === 'wasteland') lists.wasteland.push(c);
  }
  return makeLayout({ id, name: name || 'Geteilte Karte', ...lists });
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

// MARK: Karte aus einem Spiel zurückgewinnen

/**
 * Baut die Karte aus den vorgedruckten Feldern eines Rasters nach. So kann
 * „Blatt leeren“ auch dann ein frisches Blatt erzeugen, wenn die eigene Karte
 * inzwischen gelöscht wurde.
 */
export function layoutFromGrid(grid: MapGrid, meta: { id: string; name: string }): MapLayout {
  const of = (feature: PrintedFeature) => allCoordinates(grid).filter((c) => cellAt(grid, c).printed === feature);
  return makeLayout({
    ...meta,
    size: grid.size,
    ruinsArePaintable: grid.ruinsArePaintable,
    mountains: of('mountain'),
    ruins: of('ruins'),
    wasteland: of('wasteland'),
  });
}

// MARK: Bearbeiten im Editor

/** Stellt alle `cells` auf `feature` (`free` = leeren). Liefert dieselbe Karte, wenn sich nichts ändert. */
export function setFeature(layout: MapLayout, cells: readonly Coordinate[], feature: PrintedFeature): MapLayout {
  if (cells.every((c) => printedFeatureAt(layout, c) === feature)) return layout;
  const without = (list: readonly Coordinate[]) => list.filter((x) => !cells.some((c) => sameCoordinate(c, x)));
  const add = (list: readonly Coordinate[], f: PrintedFeature) => sortRowMajor(f === feature ? [...without(list), ...cells] : without(list));
  return {
    ...layout,
    mountains: add(layout.mountains, 'mountain'),
    ruins: add(layout.ruins, 'ruins'),
    wasteland: add(layout.wasteland, 'wasteland'),
  };
}

function sortRowMajor(list: Coordinate[]): Coordinate[] {
  return list
    .filter((c, i) => list.findIndex((x) => sameCoordinate(x, c)) === i)
    .sort((a, b) => a.row - b.row || a.column - b.column);
}

// MARK: Zufällige Karte

/**
 * Zufällige Karte als Ausgangspunkt im Editor: 5 Berge nicht am Rand und nicht
 * direkt nebeneinander (auch nicht diagonal), 6 Ruinen auf freien Feldern, die
 * sich nicht berühren. Keine Schlucht.
 */
export function randomLayout(name: string, random: () => number = Math.random, id: string = newCustomId(random)): MapLayout {
  const taken: Coordinate[] = [];
  const touches = (a: Coordinate, list: Coordinate[]) =>
    list.some((b) => Math.abs(a.row - b.row) <= 1 && Math.abs(a.column - b.column) <= 1);
  const pick = (count: number, inner: boolean): Coordinate[] => {
    const result: Coordinate[] = [];
    for (let attempts = 0; result.length < count && attempts < 2000; attempts++) {
      const lo = inner ? 1 : 0;
      const span = CUSTOM_MAP_SIZE - 2 * lo;
      const c = coord(lo + Math.floor(random() * span), lo + Math.floor(random() * span));
      if (touches(c, result) || taken.some((t) => t.row === c.row && t.column === c.column)) continue;
      result.push(c);
      taken.push(c);
    }
    return result;
  };
  const mountains = pick(TYPICAL_COUNTS.mountains, true);
  const ruins = pick(TYPICAL_COUNTS.ruins, false);
  return makeLayout({ id, name, mountains, ruins });
}

// MARK: Speichern

/**
 * Eigene Karten im `localStorage`. Gespeicherte Karten werden nicht mehr
 * verändert (#27): teilen und löschen ja, bearbeiten nein.
 */
export class CustomMapStore {
  constructor(
    private readonly storage: KeyValueStorage,
    readonly key = 'kartograph-block:custom-maps',
  ) {}

  list(): MapLayout[] {
    try {
      const raw = this.storage.getItem(this.key);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as MapLayout[]).filter((l) => isCustomLayoutId(l.id)) : [];
    } catch {
      return [];
    }
  }

  get(id: string): MapLayout | undefined {
    return this.list().find((l) => l.id === id);
  }

  /** Neue Karte hinten anfügen. Eine vorhandene Kennung wird nicht überschrieben. */
  add(layout: MapLayout): void {
    const maps = this.list();
    if (maps.some((l) => l.id === layout.id)) return;
    this.write([...maps, layout]);
  }

  remove(id: string): void {
    this.write(this.list().filter((l) => l.id !== id));
  }

  /** Gibt es schon eine Karte mit genau diesem Inhalt (z. B. denselben Link zweimal geöffnet)? */
  findSame(layout: MapLayout): MapLayout | undefined {
    const code = encodeLayout(layout);
    return this.list().find((l) => encodeLayout(l) === code);
  }

  private write(maps: MapLayout[]): void {
    this.storage.setItem(this.key, JSON.stringify(maps));
  }
}
