import { createGrid, surroundedMountains, type MapGrid } from './mapGrid';
import { STANDARD_LAYOUT, type MapLayout } from './mapLayout';
import { scoreSeason, seasonTotal, type DecreeAssignment, type SeasonScore } from './scoring/engine';
import { SEASONS, type Season } from './season';

export const GAME_FORMAT_VERSION = 1;

/**
 * Kompletter Spielstand eines Spielers (= ein Blatt des Eintrageblocks).
 *
 * Bewusst reine, unveränderliche Daten ohne UI-Abhängigkeit:
 * Undo = vorherigen Wert wiederherstellen, Speichern = JSON schreiben.
 */
export interface GameState {
  readonly formatVersion: number;
  readonly id: string;
  readonly playerName: string;
  readonly layoutId: string;
  readonly grid: MapGrid;
  readonly decrees: DecreeAssignment;
  /**
   * Von Hand eingetragene Goldmünzen (Münzsymbole auf Erkundungskarten).
   * Gold für eingekreiste Berge kommt dazu, wird aber aus dem Raster berechnet,
   * siehe `totalGold`.
   */
  readonly gold: number;
  /** Abgeschlossene Jahreszeitenwertungen in Spielreihenfolge. */
  readonly seasonScores: readonly SeasonScore[];
}

export function createGame(options: {
  decrees: DecreeAssignment;
  layout?: MapLayout;
  playerName?: string;
  id?: string;
}): GameState {
  const layout = options.layout ?? STANDARD_LAYOUT;
  return {
    formatVersion: GAME_FORMAT_VERSION,
    id: options.id ?? crypto.randomUUID(),
    playerName: options.playerName ?? '',
    layoutId: layout.id,
    grid: createGrid(layout),
    decrees: options.decrees,
    gold: 0,
    seasonScores: [],
  };
}

// MARK: Jahreszeiten

/** Die laufende Jahreszeit, `null` wenn alle vier gewertet sind. */
export function currentSeason(state: GameState): Season | null {
  return SEASONS[state.seasonScores.length] ?? null;
}

export function isFinished(state: GameState): boolean {
  return currentSeason(state) === null;
}

export function totalScore(state: GameState): number {
  return state.seasonScores.reduce((sum, s) => sum + seasonTotal(s), 0);
}

export function scoreFor(state: GameState, season: Season): SeasonScore | undefined {
  return state.seasonScores.find((s) => s.season === season);
}

/** Vorschau: Was brächte die laufende Jahreszeit, wenn sie jetzt endete? */
export function currentSeasonPreview(state: GameState): SeasonScore | null {
  const season = currentSeason(state);
  return season ? scoreSeason(season, state.grid, state.decrees, totalGold(state)) : null;
}

/**
 * Wertet die laufende Jahreszeit und schaltet zur nächsten weiter.
 * Liefert den Zustand unverändert zurück, wenn das Spiel schon vorbei ist.
 */
export function endCurrentSeason(state: GameState): GameState {
  const result = currentSeasonPreview(state);
  return result ? { ...state, seasonScores: [...state.seasonScores, result] } : state;
}

// MARK: Gold

/** Gold für eingekreiste Berge. Berechnet, damit Rückgängig es automatisch mitnimmt. */
export function mountainGold(state: GameState): number {
  return surroundedMountains(state.grid).length;
}

/** Alles Gold, das in der Jahreszeitenwertung zählt. */
export function totalGold(state: GameState): number {
  return state.gold + mountainGold(state);
}

/** Ändert nur die von Hand eingetragenen Münzen; nie unter 0. */
export function adjustGold(state: GameState, delta: number): GameState {
  const gold = Math.max(0, state.gold + delta);
  return gold === state.gold ? state : { ...state, gold };
}
