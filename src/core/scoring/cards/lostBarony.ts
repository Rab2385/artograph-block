import { coord } from '../../coordinate';
import { isFilled } from '../../mapGrid';
import type { ScoringCard } from '../scoringCard';

/** Kantenlänge des größten Quadrats aus gefüllten Feldern, mal 3. */
export const lostBarony: ScoringCard = {
  id: 'lostBarony',
  category: 'spatial',
  ruleText: '3 Punkte je Feld entlang einer Seite des größten Quadrats aus gefüllten Feldern.',
  score(grid) {
    // Klassisch: größtes Quadrat, das an (row, column) rechts unten endet.
    const side: number[][] = [];
    let best = 0;
    for (let row = 0; row < grid.size; row++) {
      side.push([]);
      for (let column = 0; column < grid.size; column++) {
        let value = 0;
        if (isFilled(grid, coord(row, column))) {
          const up = side[row - 1]?.[column] ?? 0;
          const left = side[row]![column - 1] ?? 0;
          const diagonal = side[row - 1]?.[column - 1] ?? 0;
          value = 1 + Math.min(up, left, diagonal);
        }
        side[row]!.push(value);
        best = Math.max(best, value);
      }
    }
    return 3 * best;
  },
};
