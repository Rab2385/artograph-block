import { coord, coordinateKey, orthogonalNeighbors, type Coordinate } from './coordinate';
import { printedFeatureAt, type MapLayout } from './mapLayout';
import type { Cell, Terrain } from './terrain';

/**
 * Das 11 × 11 Raster eines Spielers. Reine, unveränderliche Daten:
 * Ändern liefert ein neues Raster. Das macht Undo (alten Wert behalten)
 * und Speichern (JSON) trivial.
 */
export interface MapGrid {
  readonly size: number;
  readonly ruinsArePaintable: boolean;
  /** Zeilenweise abgelegt: Index = row * size + column. */
  readonly cells: readonly Cell[];
}

export function createGrid(layout: MapLayout): MapGrid {
  const cells: Cell[] = [];
  for (let row = 0; row < layout.size; row++) {
    for (let column = 0; column < layout.size; column++) {
      cells.push({ printed: printedFeatureAt(layout, coord(row, column)), terrain: null });
    }
  }
  return { size: layout.size, ruinsArePaintable: layout.ruinsArePaintable, cells };
}

// MARK: Zugriff

export function contains(grid: MapGrid, c: Coordinate): boolean {
  return c.row >= 0 && c.row < grid.size && c.column >= 0 && c.column < grid.size;
}

export function cellAt(grid: MapGrid, c: Coordinate): Cell {
  const cell = contains(grid, c) ? grid.cells[c.row * grid.size + c.column] : undefined;
  if (!cell) throw new RangeError(`Koordinate ${coordinateKey(c)} außerhalb des Rasters`);
  return cell;
}

export function terrainAt(grid: MapGrid, c: Coordinate): Terrain | null {
  return contains(grid, c) ? cellAt(grid, c).terrain : null;
}

export function allCoordinates(grid: MapGrid): Coordinate[] {
  const result: Coordinate[] = [];
  for (let row = 0; row < grid.size; row++) {
    for (let column = 0; column < grid.size; column++) result.push(coord(row, column));
  }
  return result;
}

export function coordinatesOf(grid: MapGrid, terrain: Terrain): Coordinate[] {
  return allCoordinates(grid).filter((c) => cellAt(grid, c).terrain === terrain);
}

/** Liegt das Feld in der äußersten Zeile oder Spalte? */
export function isOnEdge(grid: MapGrid, c: Coordinate): boolean {
  return c.row === 0 || c.column === 0 || c.row === grid.size - 1 || c.column === grid.size - 1;
}

export function neighbors(grid: MapGrid, c: Coordinate): Coordinate[] {
  return orthogonalNeighbors(c).filter((n) => contains(grid, n));
}

// MARK: Regeln für das Bemalen

/** Darf hier überhaupt eine Geländeart eingetragen werden? */
export function isPaintable(grid: MapGrid, c: Coordinate): boolean {
  if (!contains(grid, c)) return false;
  switch (cellAt(grid, c).printed) {
    case 'free':
      return true;
    case 'ruins':
      return grid.ruinsArePaintable;
    case 'mountain':
    case 'wasteland':
      return false;
  }
}

/** Bemalbar und noch ohne Geländeart. */
export function isEmpty(grid: MapGrid, c: Coordinate): boolean {
  return isPaintable(grid, c) && cellAt(grid, c).terrain === null;
}

/**
 * „Gefüllt“ im Sinne der Regeln: eingetragenes Gelände, Berg oder Ödland.
 * Ruinen zählen als leer, bis darauf gezeichnet wird.
 */
export function isFilled(grid: MapGrid, c: Coordinate): boolean {
  if (!contains(grid, c)) return false;
  const cell = cellAt(grid, c);
  return cell.terrain !== null || cell.printed === 'mountain' || cell.printed === 'wasteland';
}

/** Gefüllt oder außerhalb des Rasters: so zählt der Kartenrand bei „umgeben“. */
export function isFilledOrEdge(grid: MapGrid, c: Coordinate): boolean {
  return !contains(grid, c) || isFilled(grid, c);
}

/** An allen vier Seiten von gefüllten Feldern oder dem Kartenrand umgeben. */
export function isSurrounded(grid: MapGrid, c: Coordinate): boolean {
  return orthogonalNeighbors(c).every((n) => isFilledOrEdge(grid, n));
}

/**
 * Zusammenhängende Gruppen („Gebiete“) einer Geländeart: orthogonal verbundene
 * Felder. Ein einzelnes Feld ist auch ein Gebiet.
 */
export function clustersOf(grid: MapGrid, terrain: Terrain): Coordinate[][] {
  const seen = new Set<string>();
  const clusters: Coordinate[][] = [];
  for (const start of coordinatesOf(grid, terrain)) {
    if (seen.has(coordinateKey(start))) continue;
    const cluster: Coordinate[] = [];
    const queue = [start];
    seen.add(coordinateKey(start));
    while (queue.length > 0) {
      const c = queue.pop()!;
      cluster.push(c);
      for (const n of neighbors(grid, c)) {
        if (!seen.has(coordinateKey(n)) && cellAt(grid, n).terrain === terrain) {
          seen.add(coordinateKey(n));
          queue.push(n);
        }
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

/** Alle Nachbarfelder eines Gebiets, ohne die Felder des Gebiets selbst. */
export function clusterNeighbors(grid: MapGrid, cluster: readonly Coordinate[]): Coordinate[] {
  const inside = new Set(cluster.map(coordinateKey));
  const result = new Map<string, Coordinate>();
  for (const c of cluster) {
    for (const n of neighbors(grid, c)) {
      const key = coordinateKey(n);
      if (!inside.has(key)) result.set(key, n);
    }
  }
  return [...result.values()];
}

/** Berge, deren vier Nachbarn alle gefüllt sind (der Kartenrand zählt mit): je 1 Gold. */
export function surroundedMountains(grid: MapGrid): Coordinate[] {
  return allCoordinates(grid).filter((c) => isMountain(grid, c) && isSurrounded(grid, c));
}

export function isMountain(grid: MapGrid, c: Coordinate): boolean {
  return contains(grid, c) && cellAt(grid, c).printed === 'mountain';
}

// MARK: Ändern

/**
 * Monsterfelder sind bis zum Spielende festgeschrieben: Sie lassen sich weder
 * radieren noch übermalen.
 */
export function isLocked(grid: MapGrid, c: Coordinate): boolean {
  return contains(grid, c) && cellAt(grid, c).terrain === 'monster';
}

/** Kann `terrain` hier eingetragen werden? Monster nur auf leere Felder. */
export function canPaint(grid: MapGrid, c: Coordinate, terrain: Terrain | null): boolean {
  if (!isPaintable(grid, c) || isLocked(grid, c)) return false;
  return terrain !== 'monster' || cellAt(grid, c).terrain === null;
}

/**
 * Trägt `terrain` in alle Felder ein, wo das erlaubt ist (`null` = radieren).
 * Nicht bemalbare und gesperrte Felder werden stillschweigend übersprungen.
 * Liefert dasselbe Objekt zurück, wenn sich nichts geändert hat.
 */
export function paint(grid: MapGrid, coordinates: Iterable<Coordinate>, terrain: Terrain | null): MapGrid {
  let cells: Cell[] | null = null;
  for (const c of coordinates) {
    if (!canPaint(cells ? { ...grid, cells } : grid, c, terrain)) continue;
    const index = c.row * grid.size + c.column;
    const current = (cells ?? grid.cells)[index]!;
    if (current.terrain === terrain) continue;
    cells ??= grid.cells.slice();
    cells[index] = { ...current, terrain };
  }
  return cells ? { ...grid, cells } : grid;
}

export function erase(grid: MapGrid, coordinates: Iterable<Coordinate>): MapGrid {
  return paint(grid, coordinates, null);
}
