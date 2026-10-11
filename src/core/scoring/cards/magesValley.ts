import { coordinatesOf, isMountain, neighbors, type MapGrid } from '../../mapGrid';
import type { Terrain } from '../../terrain';
import type { ScoringCard } from '../scoringCard';

function countNextToMountain(grid: MapGrid, terrain: Terrain): number {
  return coordinatesOf(grid, terrain).filter((c) => neighbors(grid, c).some((n) => isMountain(grid, n))).length;
}

/** Wasser und Acker direkt neben Bergen. */
export const magesValley: ScoringCard = {
  id: 'magesValley',
  category: 'waterFarm',
  ruleText: '2 Punkte je Wasserfeld neben einem Berg, 1 Punkt je Ackerfeld neben einem Berg.',
  score: (grid) => 2 * countNextToMountain(grid, 'water') + countNextToMountain(grid, 'farm'),
};
