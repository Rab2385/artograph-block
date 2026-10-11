import { coord, sameCoordinate, type Coordinate } from './coordinate';
import type { PrintedFeature } from './terrain';

/**
 * Konfiguration der vorgedruckten Felder einer Blockseite.
 *
 * Positionen sind 0-basiert als (Zeile, Spalte), Zeile 0 = oben.
 * Neue Varianten lassen sich hier ergänzen, ohne Raster- oder Wertungscode anzufassen.
 */
export interface MapLayout {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly mountains: readonly Coordinate[];
  readonly ruins: readonly Coordinate[];
  readonly wasteland: readonly Coordinate[];
  /** Im Original wird auf Ruinenfelder ganz normal gezeichnet. */
  readonly ruinsArePaintable: boolean;
}

export function makeLayout(
  layout: Pick<MapLayout, 'id' | 'name' | 'mountains' | 'ruins'> & Partial<MapLayout>,
): MapLayout {
  return { size: 11, wasteland: [], ruinsArePaintable: true, ...layout };
}

export function printedFeatureAt(layout: MapLayout, c: Coordinate): PrintedFeature {
  const has = (list: readonly Coordinate[]) => list.some((x) => sameCoordinate(x, c));
  if (has(layout.mountains)) return 'mountain';
  if (has(layout.wasteland)) return 'wasteland';
  if (has(layout.ruins)) return 'ruins';
  return 'free';
}

/**
 * Vorderseite des Blocks (Standardkarte).
 * TODO (#6): Positionen mit dem echten Block abgleichen.
 */
export const STANDARD_LAYOUT = makeLayout({
  id: 'standard',
  name: 'Vorderseite (Standard)',
  mountains: [coord(1, 3), coord(2, 8), coord(5, 5), coord(8, 2), coord(9, 7)],
  ruins: [coord(1, 5), coord(2, 1), coord(2, 9), coord(8, 1), coord(8, 9), coord(9, 5)],
});

/**
 * Rückseite des Blocks (Ödland-Variante mit Schlucht).
 * PLATZHALTER (#7): Positionen sind noch NICHT vom Original übernommen.
 */
export const WASTELAND_LAYOUT = makeLayout({
  id: 'wasteland',
  name: 'Rückseite (Ödland) – Platzhalter',
  mountains: [coord(1, 8), coord(2, 3), coord(7, 5), coord(8, 9), coord(9, 2)],
  ruins: [coord(1, 2), coord(1, 6), coord(5, 1), coord(5, 9), coord(9, 4), coord(9, 8)],
  wasteland: [coord(3, 5), coord(4, 5), coord(5, 5), coord(5, 6), coord(6, 5)],
});

export const ALL_LAYOUTS: readonly MapLayout[] = [STANDARD_LAYOUT, WASTELAND_LAYOUT];

export function layoutById(id: string): MapLayout | undefined {
  return ALL_LAYOUTS.find((l) => l.id === id);
}
