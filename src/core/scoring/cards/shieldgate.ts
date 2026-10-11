import { clustersOf } from '../../mapGrid';
import type { ScoringCard } from '../scoringCard';

/**
 * Das zweitgrößte Dorfgebiet. Sind zwei Gebiete gleich groß und die größten,
 * ist eines davon das zweitgrößte.
 */
export const shieldgate: ScoringCard = {
  id: 'shieldgate',
  category: 'village',
  ruleText: '2 Punkte je Feld im zweitgrößten Dorfgebiet.',
  score(grid) {
    const sizes = clustersOf(grid, 'village')
      .map((cluster) => cluster.length)
      .sort((a, b) => b - a);
    return 2 * (sizes[1] ?? 0);
  },
};
