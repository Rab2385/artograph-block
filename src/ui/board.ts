import {
  cellAt,
  coord,
  isSurrounded,
  coordinateKey,
  GridGeometry,
  StrokeCollector,
  TERRAIN_NAMES,
  type Coordinate,
  type MapGrid,
  type Point,
} from '../core';
import { hatchPatterns, TERRAIN_COLORS } from './icons';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Kantenlänge eines Feldes in SVG-Einheiten. */
const CELL = 100;
/** Rand für den doppelten Kartenrahmen; links und unten mehr Platz für die Beschriftung. */
const PAD = 14;
const LABEL = 46;
/** Gesamtbreite und -höhe der Karte in SVG-Einheiten (quadratisch). */
const totalFor = (size: number) => size * CELL + 2 * PAD + LABEL;
const LABEL_COLOR = '#A87A22';
const INK = '#3A2A1A';
const WAX = '#8E2A22';

export interface BoardHandlers {
  /** Darf das Feld in die Auswahl? */
  accept(c: Coordinate): boolean;
  /** Eine neue Berührung beginnt (z. B. um einen offenen Kompass zu schließen). */
  onStrokeStart(): void;
  /** Finger oder Stift wurde losgelassen; `cells` in Zeichenreihenfolge. */
  onSelect(cells: readonly Coordinate[]): void;
}

/**
 * Die Karte als SVG. Nimmt Tippen und Freihandstriche (Stift oder Finger)
 * entgegen und rastet sie auf Felder ein:
 * - Tippen markiert ein Feld,
 * - Ziehen markiert alle überstrichenen Felder,
 * - nach dem Loslassen entscheidet `onSelect`, was passiert.
 */
export class BoardView {
  readonly element: SVGSVGElement;
  private readonly cellsLayer: SVGGElement;
  private readonly selectionLayer: SVGGElement;
  private readonly strokePath: SVGPathElement;

  private size = 11;
  private geometry = new GridGeometry(11, 11 * CELL);
  private stroke: StrokeCollector | null = null;
  private strokeStart: Point | null = null;
  private strokePoints: Point[] = [];
  private isStroking = false;
  private selectionColor = WAX;
  private shownSelection: readonly Coordinate[] = [];

  constructor(private readonly handlers: BoardHandlers) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.classList.add('board');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Karte');
    svg.innerHTML =
      `<defs>${hatchPatterns('hatch-')}</defs>` +
      '<g class="board-cells"></g><g class="board-selection"></g>' +
      `<path class="board-stroke" fill="none" stroke="${INK}" stroke-opacity="0.75" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
    this.element = svg;
    this.cellsLayer = svg.querySelector('.board-cells')!;
    this.selectionLayer = svg.querySelector('.board-selection')!;
    this.strokePath = svg.querySelector('.board-stroke')!;

    svg.addEventListener('pointerdown', (e) => this.pointerDown(e));
    svg.addEventListener('pointermove', (e) => this.pointerMove(e));
    svg.addEventListener('pointerup', () => this.pointerUp());
    svg.addEventListener('pointercancel', () => this.reset());
  }

  /** Zeichnet die Karte neu. `selection` sind die markierten Felder (z. B. für den Kompass). */
  render(grid: MapGrid, selection: readonly Coordinate[], selectionColor: string): void {
    if (grid.size !== this.size) {
      this.size = grid.size;
      this.geometry = new GridGeometry(grid.size, grid.size * CELL);
    }
    const side = this.size * CELL;
    const total = totalFor(this.size);
    this.element.setAttribute('viewBox', `${-PAD - LABEL} ${-PAD} ${total} ${total}`);
    this.element.setAttribute('aria-label', `Karte, ${this.size} mal ${this.size} Felder`);

    let html = `<rect width="${side}" height="${side}" fill="#F6EDD6" fill-opacity="0.75"/>`;
    for (let row = 0; row < this.size; row++) {
      for (let column = 0; column < this.size; column++) {
        html += this.cellMarkup(grid, coord(row, column));
      }
    }
    let lines = '';
    for (let i = 0; i <= this.size; i++) lines += `M${i * CELL} 0V${side}M0 ${i * CELL}H${side}`;
    html +=
      `<path d="${lines}" stroke="${INK}" stroke-opacity="0.45" stroke-width="1.5" fill="none"/>` +
      `<rect x="-3" y="-3" width="${side + 6}" height="${side + 6}" fill="none" stroke="${INK}" stroke-width="4"/>` +
      `<rect x="-11" y="-11" width="${side + 22}" height="${side + 22}" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
    html += this.labelsMarkup(side);
    this.cellsLayer.innerHTML = html;

    this.selectionColor = selectionColor;
    if (!this.stroke) this.showSelection(selection);
  }

  /** Bildschirm-Rechteck um die Felder, z. B. um den Kompass daneben zu setzen. */
  screenRectOf(cells: readonly Coordinate[]): DOMRect {
    const box = this.element.getBoundingClientRect();
    const scale = box.width / totalFor(this.size);
    const rows = cells.map((c) => c.row);
    const columns = cells.map((c) => c.column);
    const originX = box.left + (PAD + LABEL) * scale;
    const originY = box.top + PAD * scale;
    const left = originX + Math.min(...columns) * CELL * scale;
    const top = originY + Math.min(...rows) * CELL * scale;
    const right = originX + (Math.max(...columns) + 1) * CELL * scale;
    const bottom = originY + (Math.max(...rows) + 1) * CELL * scale;
    return new DOMRect(left, top, right - left, bottom - top);
  }

  // MARK: Zeichnen

  private cellMarkup(grid: MapGrid, c: Coordinate): string {
    const cell = cellAt(grid, c);
    const x = c.column * CELL;
    const y = c.row * CELL;
    let s = '';
    if (cell.printed === 'wasteland') {
      s += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="#8A857C" fill-opacity="0.6"><title>Schlucht</title></rect>`;
      s += use('wasteland', x + 15, y + 15, 70, '#4E4A44');
    }
    if (cell.terrain) {
      const color = TERRAIN_COLORS[cell.terrain];
      s += `<rect x="${x + 2}" y="${y + 2}" width="${CELL - 4}" height="${CELL - 4}" fill="url(#hatch-${cell.terrain})"><title>${TERRAIN_NAMES[cell.terrain]}</title></rect>`;
      s += use(cell.terrain, x + 20, y + 20, 60, color.ink);
    }
    if (cell.printed === 'mountain') {
      // Eingekreister Berg bringt Gold: goldener Ring wie im Entwurf (#8).
      if (isSurrounded(grid, c)) {
        s +=
          `<circle cx="${x + CELL / 2}" cy="${y + CELL / 2}" r="${CELL * 0.46}" fill="#D9A93A" fill-opacity="0.18" stroke="#C9962B" stroke-width="5"><title>Eingekreist: 1 Gold</title></circle>` +
          `<circle cx="${x + CELL / 2}" cy="${y + CELL / 2}" r="${CELL * 0.56}" fill="none" stroke="#C9962B" stroke-width="2" stroke-dasharray="5 6"/>`;
      }
      s += use('mountain', x + 10, y + 12, 80, INK);
    }
    if (cell.printed === 'ruins') s += use('ruins', x + 4, y + 4, 36, INK);
    return s;
  }

  /** Beschriftung wie auf dem Block: Zeilen A–K links, Spalten 1–11 unten. */
  private labelsMarkup(side: number): string {
    let s = `<g aria-hidden="true" fill="${LABEL_COLOR}" font-family="Alegreya, Georgia, serif" font-size="34" font-weight="700" text-anchor="middle">`;
    for (let i = 0; i < this.size; i++) {
      s += `<text x="${-PAD - LABEL / 2}" y="${i * CELL + CELL / 2 + 12}">${String.fromCharCode(65 + i)}</text>`;
      s += `<text x="${i * CELL + CELL / 2}" y="${side + PAD + LABEL / 2 + 12}">${i + 1}</text>`;
    }
    return s + '</g>';
  }

  private showSelection(cells: readonly Coordinate[]): void {
    this.shownSelection = cells;
    if (cells.length === 0) {
      this.selectionLayer.innerHTML = '';
      return;
    }
    const keys = new Set(cells.map(coordinateKey));
    const has = (row: number, column: number) => keys.has(`${row},${column}`);
    let fills = '';
    let edges = '';
    for (const c of cells) {
      const x = c.column * CELL;
      const y = c.row * CELL;
      fills += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}"/>`;
      if (!has(c.row - 1, c.column)) edges += `M${x} ${y}H${x + CELL}`;
      if (!has(c.row + 1, c.column)) edges += `M${x} ${y + CELL}H${x + CELL}`;
      if (!has(c.row, c.column - 1)) edges += `M${x} ${y}V${y + CELL}`;
      if (!has(c.row, c.column + 1)) edges += `M${x + CELL} ${y}V${y + CELL}`;
    }
    const color = this.selectionColor;
    this.selectionLayer.innerHTML =
      `<g fill="${color}" fill-opacity="0.16">${fills}</g>` +
      `<path d="${edges}" stroke="${color}" stroke-width="6" stroke-dasharray="15 9" stroke-linecap="round" fill="none"/>`;
  }

  // MARK: Eingabe

  private toBoard(e: PointerEvent): Point {
    const box = this.element.getBoundingClientRect();
    const scale = totalFor(this.size) / box.width;
    return { x: (e.clientX - box.left) * scale - PAD - LABEL, y: (e.clientY - box.top) * scale - PAD };
  }

  private pointerDown(e: PointerEvent): void {
    if (e.button > 0 || this.stroke) return;
    e.preventDefault();
    this.element.setPointerCapture(e.pointerId);
    this.handlers.onStrokeStart();
    const p = this.toBoard(e);
    this.stroke = new StrokeCollector();
    this.stroke.add(p, this.geometry, (c) => this.handlers.accept(c));
    this.strokeStart = p;
    this.strokePoints = [p];
    this.isStroking = false;
    this.showSelection(this.stroke.coordinates);
  }

  private pointerMove(e: PointerEvent): void {
    if (!this.stroke || !this.strokeStart) return;
    const p = this.toBoard(e);
    // Erst ab spürbarer Bewegung gilt die Berührung als Strich, vorher als Tippen.
    if (!this.isStroking && Math.hypot(p.x - this.strokeStart.x, p.y - this.strokeStart.y) > CELL * 0.35) {
      this.isStroking = true;
    }
    if (!this.isStroking) return;
    this.stroke.add(p, this.geometry, (c) => this.handlers.accept(c));
    this.strokePoints.push(p);
    this.strokePath.setAttribute('d', 'M' + this.strokePoints.map((q) => `${q.x} ${q.y}`).join('L'));
    if (this.stroke.coordinates.length !== this.shownSelection.length) this.showSelection(this.stroke.coordinates);
  }

  private pointerUp(): void {
    const cells = this.stroke?.coordinates ?? [];
    this.reset();
    if (cells.length > 0) this.handlers.onSelect(cells);
  }

  private reset(): void {
    this.stroke = null;
    this.strokeStart = null;
    this.strokePoints = [];
    this.isStroking = false;
    this.strokePath.removeAttribute('d');
    this.showSelection([]);
  }
}

function use(name: string, x: number, y: number, size: number, color: string): string {
  return `<use href="#i-${name}" x="${x}" y="${y}" width="${size}" height="${size}" color="${color}"/>`;
}
