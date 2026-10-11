import { cellAt, clusterNeighbors, clustersOf, isOnEdge, type MapGrid } from '../../mapGrid';
import type { Terrain } from '../../terrain';
import type { ScoringCard } from '../scoringCard';

/** Gebiete von `terrain`, die weder `other` berühren noch am Kartenrand liegen. */
function isolatedClusters(grid: MapGrid, terrain: Terrain, other: Terrain): number {
  return clustersOf(grid, terrain).filter(
    (cluster) =>
      !cluster.some((c) => isOnEdge(grid, c)) &&
      !clusterNeighbors(grid, cluster).some((n) => cellAt(grid, n).terrain === other),
  ).length;
}

export const shoresideExpanse: ScoringCard = {
  id: 'shoresideExpanse',
  category: 'waterFarm',
  ruleText:
    '3 Punkte je Ackergebiet ohne Kontakt zu Wasser und Kartenrand, 3 Punkte je Wassergebiet ohne Kontakt zu Acker und Kartenrand.',
  score: (grid) => 3 * (isolatedClusters(grid, 'farm', 'water') + isolatedClusters(grid, 'water', 'farm')),
};
