import { coordinateKey } from '../../coordinate';
import { clusterNeighbors, clustersOf, isMountain } from '../../mapGrid';
import type { ScoringCard } from '../scoringCard';

/**
 * Berge, die über ein Waldgebiet mit einem anderen Berg verbunden sind.
 * Jeder Berg zählt höchstens einmal (3 Punkte), auch bei mehreren Verbindungen.
 */
export const stonesideForest: ScoringCard = {
  id: 'stonesideForest',
  category: 'forest',
  ruleText: '3 Punkte je Berg, der über ein Waldgebiet mit einem anderen Berg verbunden ist (je Berg höchstens einmal).',
  score(grid) {
    const connected = new Set<string>();
    for (const cluster of clustersOf(grid, 'forest')) {
      const mountains = clusterNeighbors(grid, cluster).filter((c) => isMountain(grid, c));
      if (mountains.length >= 2) mountains.forEach((m) => connected.add(coordinateKey(m)));
    }
    return 3 * connected.size;
  },
};
