import { clustersOf } from '../../mapGrid';
import type { ScoringCard } from '../scoringCard';

export const wildholds: ScoringCard = {
  id: 'wildholds',
  category: 'village',
  ruleText: '8 Punkte je Dorfgebiet aus mindestens 6 Feldern.',
  score: (grid) => 8 * clustersOf(grid, 'village').filter((cluster) => cluster.length >= 6).length,
};
