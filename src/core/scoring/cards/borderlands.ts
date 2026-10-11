import { coord } from '../../coordinate';
import { isFilled, type MapGrid } from '../../mapGrid';
import type { ScoringCard } from '../scoringCard';

/** Vollständig gefüllte Zeilen und Spalten; Berge und Ödland zählen als gefüllt. */
export const borderlands: ScoringCard = {
  id: 'borderlands',
  category: 'spatial',
  ruleText: '6 Punkte je vollständig gefüllter Zeile oder Spalte.',
  score(grid: MapGrid) {
    let points = 0;
    for (let i = 0; i < grid.size; i++) {
      let row = true;
      let column = true;
      for (let j = 0; j < grid.size; j++) {
        row &&= isFilled(grid, coord(i, j));
        column &&= isFilled(grid, coord(j, i));
      }
      points += 6 * (Number(row) + Number(column));
    }
    return points;
  },
};
