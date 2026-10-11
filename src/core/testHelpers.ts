import { coord, type Coordinate } from './coordinate';
import { createGrid, paint, type MapGrid } from './mapGrid';
import { makeLayout, type MapLayout } from './mapLayout';
import type { DecreeAssignment } from './scoring/engine';
import type { Terrain } from './terrain';

/** Leeres 11 × 11 Raster ohne vorgedruckte Felder, für übersichtliche Tests. */
export const emptyLayout: MapLayout = makeLayout({ id: 'test', name: 'Test', mountains: [], ruins: [] });

export const c = coord;

export function grid(layout: MapLayout = emptyLayout, painted: Partial<Record<Terrain, Coordinate[]>> = {}): MapGrid {
  let g = createGrid(layout);
  for (const [terrain, coords] of Object.entries(painted) as [Terrain, Coordinate[]][]) {
    g = paint(g, coords, terrain);
  }
  return g;
}

export const sampleDecrees: DecreeAssignment = { A: 'sentinelWood', B: 'canalLake', C: 'wildholds', D: 'borderlands' };
