import { cellAt, clusterNeighbors, clustersOf, type MapGrid } from '../../mapGrid';
import type { Coordinate } from '../../coordinate';
import type { ScoringCard } from '../scoringCard';

/** Geländeart eines Nachbarfelds; Berge zählen als eigene Geländeart, Ruinen und Ödland nicht. */
function terrainType(grid: MapGrid, c: Coordinate): string | null {
  const cell = cellAt(grid, c);
  if (cell.terrain) return cell.terrain;
  return cell.printed === 'mountain' ? 'mountain' : null;
}

/** Dorfgebiete, die an mindestens drei verschiedene Geländearten grenzen; zählt je Gebiet, nicht je Feld. */
export const greengoldPlains: ScoringCard = {
  id: 'greengoldPlains',
  category: 'village',
  ruleText: '3 Punkte je Dorfgebiet, das an mindestens drei verschiedene Geländearten grenzt.',
  score(grid) {
    return (
      3 *
      clustersOf(grid, 'village').filter((cluster) => {
        const types = new Set(clusterNeighbors(grid, cluster).map((n) => terrainType(grid, n)));
        types.delete(null);
        return types.size >= 3;
      }).length
    );
  },
};
