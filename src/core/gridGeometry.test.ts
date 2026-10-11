import { describe, expect, it } from 'vitest';
import { sameCoordinate } from './coordinate';
import { GridGeometry, StrokeCollector } from './gridGeometry';
import { c } from './testHelpers';

describe('GridGeometry', () => {
  const geometry = new GridGeometry(11, 1100); // 100 px pro Feld

  it('rechnet Punkte in Felder um', () => {
    expect(geometry.coordinateAt({ x: 0, y: 0 })).toEqual(c(0, 0));
    expect(geometry.coordinateAt({ x: 250, y: 120 })).toEqual(c(1, 2));
    expect(geometry.coordinateAt({ x: 1100, y: 5 })).toBeNull();
    expect(geometry.coordinateAt({ x: -1, y: 5 })).toBeNull();
  });

  it('überspringt bei schnellen Strichen keine Felder', () => {
    const stroke = new StrokeCollector();
    stroke.add({ x: 50, y: 50 }, geometry, () => true);
    stroke.add({ x: 450, y: 50 }, geometry, () => true);
    expect(stroke.coordinates).toEqual([0, 1, 2, 3, 4].map((col) => c(0, col)));
  });

  it('ignoriert abgelehnte und doppelte Felder', () => {
    const stroke = new StrokeCollector();
    const accept = (x: ReturnType<typeof c>) => !sameCoordinate(x, c(0, 1));
    stroke.add({ x: 50, y: 50 }, geometry, accept);
    stroke.add({ x: 250, y: 50 }, geometry, accept);
    stroke.add({ x: 50, y: 50 }, geometry, accept);
    expect(stroke.coordinates).toEqual([c(0, 0), c(0, 2)]);
  });
});
