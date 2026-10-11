import type { ScoringCardId, ScoringCategory } from './cardIds';
import { placeholderCard } from './cards/placeholder';
import { sentinelWood } from './cards/sentinelWood';
import type { ScoringCard } from './scoringCard';

/** Verzeichnis aller Wertungskarten: welches Regel-Objekt zu welcher Karte gehört. */
export const SCORING_CARDS: readonly ScoringCard[] = [
  // Wald (#1)
  sentinelWood,
  placeholderCard('greenbough', 'forest'),
  placeholderCard('treetower', 'forest'),
  placeholderCard('stonesideForest', 'forest'),
  // Wasser & Acker (#2)
  placeholderCard('canalLake', 'waterFarm'),
  placeholderCard('magesValley', 'waterFarm'),
  placeholderCard('goldenGranary', 'waterFarm'),
  placeholderCard('shoresideExpanse', 'waterFarm'),
  // Dorf (#3)
  placeholderCard('wildholds', 'village'),
  placeholderCard('greatCity', 'village'),
  placeholderCard('greengoldPlains', 'village'),
  placeholderCard('shieldgate', 'village'),
  // Anordnung (#4)
  placeholderCard('borderlands', 'spatial'),
  placeholderCard('lostBarony', 'spatial'),
  placeholderCard('brokenRoad', 'spatial'),
  placeholderCard('cauldrons', 'spatial'),
];

export function cardById(id: ScoringCardId): ScoringCard {
  const card = SCORING_CARDS.find((c) => c.id === id);
  if (!card) throw new Error(`Keine Wertungskarte für ${id} im Katalog`);
  return card;
}

export function cardsInCategory(category: ScoringCategory): ScoringCard[] {
  return SCORING_CARDS.filter((c) => c.category === category);
}
