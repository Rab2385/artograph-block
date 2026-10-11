import { coordinatesOf, isSurrounded } from '../../mapGrid';
import type { ScoringCard } from '../scoringCard';

/** Waldfelder, die rundum von gefüllten Feldern oder dem Kartenrand umgeben sind. */
export const treetower: ScoringCard = {
  id: 'treetower',
  category: 'forest',
  ruleText: '1 Punkt je Waldfeld, das an allen vier Seiten von gefüllten Feldern oder dem Kartenrand umgeben ist.',
  score: (grid) => coordinatesOf(grid, 'forest').filter((c) => isSurrounded(grid, c)).length,
};
