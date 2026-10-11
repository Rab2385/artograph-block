import type { ScoringCardId, ScoringCategory } from '../cardIds';
import type { ScoringCard } from '../scoringCard';

/**
 * PLATZHALTER: Regel noch nicht umgesetzt, liefert immer 0 Punkte.
 *
 * Zum Umsetzen einer Karte eine eigene Datei nach dem Muster von
 * `sentinelWood.ts` anlegen und im Katalog statt des Platzhalters eintragen.
 */
export function placeholderCard(id: ScoringCardId, category: ScoringCategory): ScoringCard {
  return {
    id,
    category,
    ruleText: 'Platzhalter – Regel folgt.',
    isImplemented: false,
    score: () => 0,
  };
}
