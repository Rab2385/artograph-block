import {
  adjustGold,
  createGame,
  endCurrentSeason,
  erase,
  layoutById,
  layoutFromGrid,
  paint,
  UndoHistory,
  type Coordinate,
  type DecreeAssignment,
  type GameState,
  type GameStore,
  type MapLayout,
  type Terrain,
} from '../core';

export type Tool = 'draw' | 'erase';

/**
 * Verbindet den reinen Spielzustand mit der Oberfläche:
 * Jede Änderung läuft über `apply`, das Undo und Speichern übernimmt.
 */
export class GameController {
  state: GameState | null = null;
  tool: Tool = 'draw';
  /** Vorläufig markierte Felder, für die gerade der Kompass offen ist. */
  pending: readonly Coordinate[] | null = null;
  errorMessage: string | null = null;

  private readonly history = new UndoHistory<GameState>();
  private readonly listeners = new Set<() => void>();

  constructor(private readonly store: GameStore) {
    try {
      this.state = store.load();
    } catch {
      this.errorMessage = 'Der gespeicherte Spielstand konnte nicht geladen werden.';
    }
  }

  get canUndo(): boolean {
    return this.history.canUndo;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  selectTool(tool: Tool): void {
    this.tool = tool;
    this.pending = null;
    this.notify();
  }

  // MARK: Spielverwaltung

  startNewGame(options: { layout: MapLayout; decrees: DecreeAssignment; playerName: string }): void {
    this.state = createGame(options);
    this.history.clear();
    this.pending = null;
    this.save();
    this.notify();
  }

  /** Leeres Blatt mit gleicher Karte und gleichen Wertungskarten. */
  resetSheet(): void {
    if (!this.state) return;
    this.startNewGame({
      layout: this.layout(),
      decrees: this.state.decrees,
      playerName: this.state.playerName,
    });
  }

  /** Die Karte des laufenden Spiels; eigene Karten werden aus dem Raster nachgebaut (#27). */
  private layout(): MapLayout {
    const state = this.state!;
    return layoutById(state.layoutId) ?? layoutFromGrid(state.grid, { id: state.layoutId, name: state.layoutName ?? '' });
  }

  // MARK: Eintragen

  setPending(cells: readonly Coordinate[]): void {
    this.pending = cells.length > 0 ? cells : null;
    this.notify();
  }

  cancelPending(): void {
    if (!this.pending) return;
    this.pending = null;
    this.notify();
  }

  paintPending(terrain: Terrain): void {
    const cells = this.pending;
    this.pending = null;
    if (cells) this.apply((s) => withGrid(s, paint(s.grid, cells, terrain)));
    else this.notify();
  }

  erase(cells: readonly Coordinate[]): void {
    this.apply((s) => withGrid(s, erase(s.grid, cells)));
  }

  adjustGold(delta: number): void {
    this.pending = null;
    this.apply((s) => adjustGold(s, delta));
  }

  endCurrentSeason(): void {
    this.pending = null;
    this.apply(endCurrentSeason);
  }

  undo(): void {
    this.pending = null;
    const previous = this.history.popLast();
    if (previous) {
      this.state = previous;
      this.save();
    }
    this.notify();
  }

  // MARK: Intern

  /** Die Kernfunktionen liefern bei „keine Änderung“ dasselbe Objekt zurück. */
  private apply(change: (state: GameState) => GameState): void {
    const before = this.state;
    if (!before) return;
    const after = change(before);
    if (after !== before) {
      this.history.record(before);
      this.state = after;
      this.save();
    }
    this.notify();
  }

  private save(): void {
    if (!this.state) return;
    try {
      this.store.save(this.state);
    } catch {
      this.errorMessage = 'Der Spielstand konnte nicht gespeichert werden.';
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

/** Neuer Spielstand nur, wenn sich das Raster wirklich geändert hat. */
function withGrid(state: GameState, grid: GameState['grid']): GameState {
  return grid === state.grid ? state : { ...state, grid };
}
