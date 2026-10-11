import { describe, expect, it } from 'vitest';
import { allCoordinates, cellAt, coordinatesOf, createGrid, erase, isEmpty, isPaintable, paint } from './mapGrid';
import { makeLayout, STANDARD_LAYOUT } from './mapLayout';
import { c, emptyLayout, grid } from './testHelpers';

describe('MapGrid', () => {
  it('Standardseite hat Berge und Ruinen', () => {
    const g = createGrid(STANDARD_LAYOUT);
    expect(g.size).toBe(11);
    expect(allCoordinates(g).filter((x) => cellAt(g, x).printed === 'mountain')).toHaveLength(5);
    expect(allCoordinates(g).filter((x) => cellAt(g, x).printed === 'ruins')).toHaveLength(6);
  });

  it('Berge sind nicht bemalbar', () => {
    const g = createGrid(STANDARD_LAYOUT);
    const mountain = STANDARD_LAYOUT.mountains[0]!;
    expect(isPaintable(g, mountain)).toBe(false);
    expect(paint(g, [mountain], 'forest')).toBe(g);
    expect(cellAt(g, mountain).terrain).toBeNull();
  });

  it('Bemalbarkeit von Ruinen ist einstellbar', () => {
    const ruin = c(3, 3);
    const paintable = createGrid(makeLayout({ id: 'a', name: 'a', mountains: [], ruins: [ruin] }));
    expect(paint(paintable, [ruin], 'village')).not.toBe(paintable);

    const blocked = createGrid(makeLayout({ id: 'b', name: 'b', mountains: [], ruins: [ruin], ruinsArePaintable: false }));
    expect(paint(blocked, [ruin], 'village')).toBe(blocked);
  });

  it('Ödland ist nicht bemalbar', () => {
    const g = createGrid(makeLayout({ id: 'w', name: 'w', mountains: [], ruins: [], wasteland: [c(5, 5)] }));
    expect(isPaintable(g, c(5, 5))).toBe(false);
  });

  it('überspringt gesperrte Felder, bemalt die anderen', () => {
    const g = paint(createGrid(makeLayout({ id: 'm', name: 'm', mountains: [c(0, 1)], ruins: [] })), [c(0, 0), c(0, 1), c(0, 2)], 'water');
    expect(coordinatesOf(g, 'water')).toEqual([c(0, 0), c(0, 2)]);
  });

  it('Radieren leert das Feld', () => {
    const g = grid(emptyLayout, { farm: [c(2, 2)] });
    const erased = erase(g, [c(2, 2)]);
    expect(erased).not.toBe(g);
    expect(isEmpty(erased, c(2, 2))).toBe(true);
    expect(erase(erased, [c(2, 2)])).toBe(erased);
  });

  it('Felder außerhalb sind nicht bemalbar', () => {
    const g = grid();
    expect(isPaintable(g, c(-1, 0))).toBe(false);
    expect(isPaintable(g, c(0, 11))).toBe(false);
  });

  it('verändert das alte Raster nicht', () => {
    const before = grid();
    paint(before, [c(1, 1)], 'forest');
    expect(cellAt(before, c(1, 1)).terrain).toBeNull();
  });
});
