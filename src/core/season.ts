/** Die vier Dekrete (Wertungsplätze) A–D. */
export const DECREES = ['A', 'B', 'C', 'D'] as const;
export type Decree = (typeof DECREES)[number];

/** Die vier Jahreszeiten in Spielreihenfolge. */
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

export const SEASON_NAMES: Record<Season, string> = {
  spring: 'Frühling',
  summer: 'Sommer',
  autumn: 'Herbst',
  winter: 'Winter',
};

/** Welche zwei Dekrete am Ende dieser Jahreszeit gewertet werden. */
export const SEASON_DECREES: Record<Season, readonly [Decree, Decree]> = {
  spring: ['A', 'B'],
  summer: ['B', 'C'],
  autumn: ['C', 'D'],
  winter: ['D', 'A'],
};

/** Zeitlimit laut Jahreszeitenkarte (nur zur Anzeige). */
export const SEASON_TIME_LIMITS: Record<Season, number> = {
  spring: 8,
  summer: 8,
  autumn: 7,
  winter: 6,
};

export function nextSeason(season: Season): Season | null {
  return SEASONS[SEASONS.indexOf(season) + 1] ?? null;
}
