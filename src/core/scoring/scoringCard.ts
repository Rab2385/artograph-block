import type { MapGrid } from '../mapGrid';
import { CARD_NAMES, type ScoringCardId, type ScoringCategory } from './cardIds';

/**
 * Gemeinsame Form aller Wertungskarten.
 *
 * Jede Karte ist ein eigenes, austauschbares Regel-Objekt: Sie bekommt das
 * Raster und liefert die Punkte zurück, ohne Seiteneffekte, damit sie sich
 * isoliert testen lässt.
 */
export interface ScoringCard {
  readonly id: ScoringCardId;
  readonly category: ScoringCategory;
  /** Kurzbeschreibung der Regel für die Anzeige, in eigenen Worten (#5). */
  readonly ruleText: string;
  /** `false` = Regel noch nicht umgesetzt (Platzhalter, liefert 0 Punkte). */
  readonly isImplemented: boolean;
  score(grid: MapGrid): number;
}

export function cardName(card: Pick<ScoringCard, 'id'>): string {
  return CARD_NAMES[card.id];
}
