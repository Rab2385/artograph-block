import { coordinatesOf, neighbors, terrainAt, type MapGrid } from '../../mapGrid';
import type { Terrain } from '../../terrain';
import type { ScoringCard } from '../scoringCard';

function countNextTo(grid: MapGrid, terrain: Terrain, other: Terrain): number {
  return coordinatesOf(grid, terrain).filter((c) => neighbors(grid, c).some((n) => terrainAt(grid, n) === other)).length;
}

/** Wasser neben Acker und Acker neben Wasser, je 1 Punkt. */
export const canalLake: ScoringCard = {
  id: 'canalLake',
  category: 'waterFarm',
  ruleText: '1 Punkt je Wasserfeld neben Acker und 1 Punkt je Ackerfeld neben Wasser.',
  score: (grid) => countNextTo(grid, 'water', 'farm') + countNextTo(grid, 'farm', 'water'),
};
