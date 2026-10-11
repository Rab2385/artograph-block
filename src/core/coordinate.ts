/** Position im Raster, 0-basiert. `row` 0 ist oben, `column` 0 ist links. */
export interface Coordinate {
  readonly row: number;
  readonly column: number;
}

export function coord(row: number, column: number): Coordinate {
  return { row, column };
}

export function sameCoordinate(a: Coordinate, b: Coordinate): boolean {
  return a.row === b.row && a.column === b.column;
}

/** Eindeutiger Schlüssel, z. B. für `Set` oder `Map`. */
export function coordinateKey(c: Coordinate): string {
  return `${c.row},${c.column}`;
}

/** Die vier orthogonalen Nachbarn (können außerhalb des Rasters liegen). */
export function orthogonalNeighbors(c: Coordinate): Coordinate[] {
  return [
    coord(c.row - 1, c.column),
    coord(c.row + 1, c.column),
    coord(c.row, c.column - 1),
    coord(c.row, c.column + 1),
  ];
}
