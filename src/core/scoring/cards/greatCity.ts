import { clusterNeighbors, clustersOf, isMountain } from '../../mapGrid';
import type { ScoringCard } from '../scoringCard';

/** Das größte Dorfgebiet, das keinen Berg berührt. */
export const greatCity: ScoringCard = {
  id: 'greatCity',
  category: 'village',
  ruleText: '1 Punkt je Feld im größten Dorfgebiet, das an keinen Berg grenzt.',
  score(grid) {
    const sizes = clustersOf(grid, 'village')
      .filter((cluster) => !clusterNeighbors(grid, cluster).some((n) => isMountain(grid, n)))
      .map((cluster) => cluster.length);
    return Math.max(0, ...sizes);
  },
};
