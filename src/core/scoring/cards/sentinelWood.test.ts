import { describe, expect, it } from 'vitest';
import { c, emptyLayout, grid } from '../../testHelpers';
import { sentinelWood as card } from './sentinelWood';

describe('Sentinel Wood', () => {
  it('leeres Raster bringt 0', () => {
    expect(card.score(grid())).toBe(0);
  });

  it('Wald in jeder Ecke und an jeder Kante zählt', () => {
    const g = grid(emptyLayout, {
      forest: [c(0, 0), c(0, 10), c(10, 0), c(10, 10), c(0, 5), c(5, 0), c(10, 5), c(5, 10)],
    });
    expect(card.score(g)).toBe(8);
  });

  it('Wald im Inneren zählt nicht', () => {
    expect(card.score(grid(emptyLayout, { forest: [c(1, 1), c(5, 5), c(9, 9), c(1, 9)] }))).toBe(0);
  });

  it('anderes Gelände am Rand zählt nicht', () => {
    const g = grid(emptyLayout, {
      forest: [c(0, 1)],
      village: [c(0, 2)],
      water: [c(10, 3)],
      farm: [c(4, 0)],
      monster: [c(6, 10)],
    });
    expect(card.score(g)).toBe(1);
  });

  it('ein voller Rand aus Wald bringt 40', () => {
    const edge = Array.from({ length: 11 }, (_, i) => [c(0, i), c(10, i), c(i, 0), c(i, 10)]).flat();
    expect(card.score(grid(emptyLayout, { forest: edge }))).toBe(40);
  });

  it('Metadaten', () => {
    expect(card.category).toBe('forest');
    expect(card.isImplemented).toBe(true);
  });
});
