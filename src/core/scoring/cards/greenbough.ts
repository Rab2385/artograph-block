import { coord } from '../../coordinate';
import { cellAt, type MapGrid } from '../../mapGrid';
import type { ScoringCard } from '../scoringCard';

/** Zeilen und Spalten mit Wald. Ein Feld kann für Zeile und Spalte zählen. */
export const greenbough: ScoringCard = {
  id: 'greenbough',
  category: 'forest',
  ruleText: '1 Punkt je Zeile und je Spalte mit mindestens einem Waldfeld.',
  score(grid: MapGrid) {
    let points = 0;
    for (let i = 0; i < grid.size; i++) {
      let inRow = false;
      let inColumn = false;
      for (let j = 0; j < grid.size; j++) {
        inRow ||= cellAt(grid, coord(i, j)).terrain === 'forest';
        inColumn ||= cellAt(grid, coord(j, i)).terrain === 'forest';
      }
      points += Number(inRow) + Number(inColumn);
    }
    return points;
  },
};
