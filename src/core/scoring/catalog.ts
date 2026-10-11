import type { ScoringCardId, ScoringCategory } from './cardIds';
import { borderlands } from './cards/borderlands';
import { brokenRoad } from './cards/brokenRoad';
import { canalLake } from './cards/canalLake';
import { cauldrons } from './cards/cauldrons';
import { goldenGranary } from './cards/goldenGranary';
import { greatCity } from './cards/greatCity';
import { greenbough } from './cards/greenbough';
import { greengoldPlains } from './cards/greengoldPlains';
import { lostBarony } from './cards/lostBarony';
import { magesValley } from './cards/magesValley';
import { sentinelWood } from './cards/sentinelWood';
import { shieldgate } from './cards/shieldgate';
import { shoresideExpanse } from './cards/shoresideExpanse';
import { stonesideForest } from './cards/stonesideForest';
import { treetower } from './cards/treetower';
import { wildholds } from './cards/wildholds';
import type { ScoringCard } from './scoringCard';

/** Verzeichnis aller Wertungskarten: welches Regel-Objekt zu welcher Karte gehört. */
export const SCORING_CARDS: readonly ScoringCard[] = [
  // Wald
  sentinelWood,
  greenbough,
  treetower,
  stonesideForest,
  // Wasser & Acker
  canalLake,
  magesValley,
  goldenGranary,
  shoresideExpanse,
  // Dorf
  wildholds,
  greatCity,
  greengoldPlains,
  shieldgate,
  // Anordnung
  borderlands,
  lostBarony,
  brokenRoad,
  cauldrons,
];

export function cardById(id: ScoringCardId): ScoringCard {
  const card = SCORING_CARDS.find((c) => c.id === id);
  if (!card) throw new Error(`Keine Wertungskarte für ${id} im Katalog`);
  return card;
}

export function cardsInCategory(category: ScoringCategory): ScoringCard[] {
  return SCORING_CARDS.filter((c) => c.category === category);
}
