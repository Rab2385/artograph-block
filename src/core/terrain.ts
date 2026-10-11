/** Geländeart, die der Spieler in ein Feld einträgt. */
export const TERRAINS = ['forest', 'village', 'water', 'farm', 'monster'] as const;
export type Terrain = (typeof TERRAINS)[number];

export const TERRAIN_NAMES: Record<Terrain, string> = {
  forest: 'Wald',
  village: 'Dorf',
  water: 'Wasser',
  farm: 'Acker',
  monster: 'Monster',
};

/**
 * Was auf dem Block an einer Stelle vorgedruckt ist.
 * - `free`: leeres Feld
 * - `mountain`: Berg, nie bemalbar
 * - `ruins`: Ruine; im Original wird darauf normal gezeichnet,
 *   ob sie bemalbar ist, legt `MapLayout.ruinsArePaintable` fest
 * - `wasteland`: Ödland/Schlucht (Rückseite des Blocks), nie bemalbar
 */
export type PrintedFeature = 'free' | 'mountain' | 'ruins' | 'wasteland';

/** Ein einzelnes Feld des Rasters. `terrain` ist `null`, solange nichts eingetragen ist. */
export interface Cell {
  readonly printed: PrintedFeature;
  readonly terrain: Terrain | null;
}
