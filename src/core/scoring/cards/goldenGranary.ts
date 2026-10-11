import { cellAt, coordinatesOf, contains, neighbors, type MapGrid } from '../../mapGrid';
import type { Coordinate } from '../../coordinate';
import type { ScoringCard } from '../scoringCard';

const isRuins = (grid: MapGrid, c: Coordinate) => contains(grid, c) && cellAt(grid, c).printed === 'ruins';

/** Wasser neben Ruinen und Acker auf Ruinen. */
export const goldenGranary: ScoringCard = {
  id: 'goldenGranary',
  category: 'waterFarm',
  ruleText: '1 Punkt je Wasserfeld neben einer Ruine, 3 Punkte je Ackerfeld auf einer Ruine.',
  score(grid) {
    const water = coordinatesOf(grid, 'water').filter((c) => neighbors(grid, c).some((n) => isRuins(grid, n))).length;
    const farm = coordinatesOf(grid, 'farm').filter((c) => isRuins(grid, c)).length;
    return water + 3 * farm;
  },
};
