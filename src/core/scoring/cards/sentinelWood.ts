import { coordinatesOf, isOnEdge } from '../../mapGrid';
import type { ScoringCard } from '../scoringCard';

/** „1 Punkt je Waldfeld am Rand des Rasters.“ */
export const sentinelWood: ScoringCard = {
  id: 'sentinelWood',
  category: 'forest',
  ruleText: '1 Punkt je Waldfeld am Rand des Rasters.',
  isImplemented: true,
  score: (grid) => coordinatesOf(grid, 'forest').filter((c) => isOnEdge(grid, c)).length,
};
