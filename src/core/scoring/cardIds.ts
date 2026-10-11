/**
 * Stabile Kennung jeder Wertungskarte (wird so gespeichert).
 *
 * Die Anzeigenamen sind die Namen der englischen Ausgabe. Die deutschen
 * Kartennamen (#5) können in `CARD_NAMES` eingetragen werden, ohne
 * gespeicherte Spielstände zu brechen.
 */
export const SCORING_CARD_IDS = [
  // Wald
  'sentinelWood',
  'greenbough',
  'treetower',
  'stonesideForest',
  // Wasser & Acker
  'canalLake',
  'magesValley',
  'goldenGranary',
  'shoresideExpanse',
  // Dorf
  'wildholds',
  'greatCity',
  'greengoldPlains',
  'shieldgate',
  // Anordnung
  'borderlands',
  'lostBarony',
  'brokenRoad',
  'cauldrons',
] as const;
export type ScoringCardId = (typeof SCORING_CARD_IDS)[number];

export const CARD_NAMES: Record<ScoringCardId, string> = {
  sentinelWood: 'Sentinel Wood',
  greenbough: 'Greenbough',
  treetower: 'Treetower',
  stonesideForest: 'Stoneside Forest',
  canalLake: 'Canal Lake',
  magesValley: 'Mages Valley',
  goldenGranary: 'The Golden Granary',
  shoresideExpanse: 'Shoreside Expanse',
  wildholds: 'Wildholds',
  greatCity: 'Great City',
  greengoldPlains: 'Greengold Plains',
  shieldgate: 'Shieldgate',
  borderlands: 'Borderlands',
  lostBarony: 'Lost Barony',
  brokenRoad: 'The Broken Road',
  cauldrons: 'The Cauldrons',
};

/** Kategorie (Rückseite) einer Wertungskarte. */
export const SCORING_CATEGORIES = ['forest', 'waterFarm', 'village', 'spatial'] as const;
export type ScoringCategory = (typeof SCORING_CATEGORIES)[number];

export const CATEGORY_NAMES: Record<ScoringCategory, string> = {
  forest: 'Wald',
  waterFarm: 'Wasser & Acker',
  village: 'Dorf',
  spatial: 'Anordnung',
};
