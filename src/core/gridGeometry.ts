import { coord, coordinateKey, sameCoordinate, type Coordinate } from './coordinate';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Umrechnung zwischen Bildschirmpunkten und Rasterfeldern.
 * Liegt im Kern (statt in der Oberfläche), damit das Einrasten testbar ist.
 */
export class GridGeometry {
  readonly cellLength: number;

  constructor(
    readonly size: number,
    sideLength: number,
  ) {
    this.cellLength = sideLength / size;
  }

  get sideLength(): number {
    return this.cellLength * this.size;
  }

  coordinateAt(p: Point): Coordinate | null {
    if (p.x < 0 || p.y < 0 || p.x >= this.sideLength || p.y >= this.sideLength) return null;
    return coord(Math.floor(p.y / this.cellLength), Math.floor(p.x / this.cellLength));
  }

  centerOf(c: Coordinate): Point {
    return { x: (c.column + 0.5) * this.cellLength, y: (c.row + 0.5) * this.cellLength };
  }

  frameOf(c: Coordinate): Rect {
    return {
      x: c.column * this.cellLength,
      y: c.row * this.cellLength,
      width: this.cellLength,
      height: this.cellLength,
    };
  }

  /**
   * Alle Felder, die eine gerade Strecke überstreicht, damit bei schnellen
   * Strichen keine Felder übersprungen werden.
   */
  coordinatesBetween(start: Point, end: Point): Coordinate[] {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(distance / (this.cellLength / 4)));
    const result: Coordinate[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const c = this.coordinateAt({ x: start.x + dx * t, y: start.y + dy * t });
      const last = result[result.length - 1];
      if (c && !(last && sameCoordinate(last, c))) result.push(c);
    }
    return result;
  }
}

/** Sammelt die Felder eines Freihandstrichs (eingerastet, ohne Duplikate, in Zeichenreihenfolge). */
export class StrokeCollector {
  private readonly collected: Coordinate[] = [];
  private readonly seen = new Set<string>();
  private lastPoint: Point | null = null;

  get coordinates(): readonly Coordinate[] {
    return this.collected;
  }

  get isEmpty(): boolean {
    return this.collected.length === 0;
  }

  add(point: Point, geometry: GridGeometry, accept: (c: Coordinate) => boolean): void {
    const touched = this.lastPoint
      ? geometry.coordinatesBetween(this.lastPoint, point)
      : [geometry.coordinateAt(point)].filter((c): c is Coordinate => c !== null);
    this.lastPoint = point;
    for (const c of touched) {
      const key = coordinateKey(c);
      if (this.seen.has(key) || !accept(c)) continue;
      this.seen.add(key);
      this.collected.push(c);
    }
  }
}
