import { coordinateKey } from '../coordinate';
import { coordinatesOf, isEmpty, neighbors, type MapGrid } from '../mapGrid';
import { DECREES, SEASON_DECREES, type Decree, type Season } from '../season';
import type { ScoringCardId } from './cardIds';
import { cardById } from './catalog';
import type { ScoringCard } from './scoringCard';

/** Punkte eines Dekrets innerhalb einer Jahreszeitenwertung. */
export interface DecreeScore {
  readonly decree: Decree;
  readonly card: ScoringCardId;
  readonly points: number;
}

/** Ergebnis einer Jahreszeit (eine Zeile im Wertungsbereich des Blocks). */
export interface SeasonScore {
  readonly season: Season;
  readonly decreeScores: readonly DecreeScore[];
  readonly gold: number;
  /** Bereits negativ (z. B. -3). */
  readonly monsterPenalty: number;
}

export function seasonTotal(score: SeasonScore): number {
  return score.decreeScores.reduce((sum, d) => sum + d.points, 0) + score.gold + score.monsterPenalty;
}

/** Zuordnung der vier aktiven Wertungskarten zu den Dekreten A–D. */
export type DecreeAssignment = Partial<Record<Decree, ScoringCardId>>;

/** Alle vier Dekrete belegt, keine Karte doppelt. */
export function isCompleteAssignment(decrees: DecreeAssignment): boolean {
  const cards = DECREES.map((d) => decrees[d]);
  return cards.every((c) => c !== undefined) && new Set(cards).size === DECREES.length;
}

/**
 * Minuspunkte: -1 für jedes leere Feld, das orthogonal an mindestens
 * ein Monsterfeld grenzt. Jedes leere Feld zählt nur einmal.
 */
export function monsterPenalty(grid: MapGrid): number {
  const emptyNextToMonster = new Set<string>();
  for (const monster of coordinatesOf(grid, 'monster')) {
    for (const n of neighbors(grid, monster)) {
      if (isEmpty(grid, n)) emptyNextToMonster.add(coordinateKey(n));
    }
  }
  return 0 - emptyNextToMonster.size; // nicht `-size`: das ergäbe -0 ohne Monster
}

/** Berechnet die Wertung einer Jahreszeit rein aus dem Raster, ohne Zustand. */
export function scoreSeason(
  season: Season,
  grid: MapGrid,
  decrees: DecreeAssignment,
  gold: number,
  catalog: (id: ScoringCardId) => ScoringCard = cardById,
): SeasonScore {
  const decreeScores: DecreeScore[] = [];
  for (const decree of SEASON_DECREES[season]) {
    const id = decrees[decree];
    if (id) decreeScores.push({ decree, card: id, points: catalog(id).score(grid) });
  }
  return { season, decreeScores, gold, monsterPenalty: monsterPenalty(grid) };
}
