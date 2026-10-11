import { allCoordinates, isEmpty, isSurrounded } from '../../mapGrid';
import type { ScoringCard } from '../scoringCard';

/** Leere Felder (auch leere Ruinen), rundum von gefüllten Feldern oder dem Kartenrand umgeben. */
export const cauldrons: ScoringCard = {
  id: 'cauldrons',
  category: 'spatial',
  ruleText: '1 Punkt je leerem Feld, das an allen vier Seiten von gefüllten Feldern oder dem Kartenrand umgeben ist.',
  score: (grid) => allCoordinates(grid).filter((c) => isEmpty(grid, c) && isSurrounded(grid, c)).length,
};
