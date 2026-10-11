import { coord } from '../../coordinate';
import { isFilled } from '../../mapGrid';
import type { ScoringCard } from '../scoringCard';

/**
 * Diagonalen, die vom linken Rand nach rechts unten bis zum unteren Rand laufen
 * und vollständig gefüllt sind. Die Diagonale ab Zeile `r` umfasst (r, 0), (r+1, 1) …
 */
export const brokenRoad: ScoringCard = {
  id: 'brokenRoad',
  category: 'spatial',
  ruleText: '3 Punkte je vollständig gefüllter Diagonale vom linken zum unteren Kartenrand.',
  score(grid) {
    let lines = 0;
    for (let start = 0; start < grid.size; start++) {
      let complete = true;
      for (let i = 0; start + i < grid.size; i++) complete &&= isFilled(grid, coord(start + i, i));
      if (complete) lines++;
    }
    return 3 * lines;
  },
};
