import { describe, expect, it } from 'vitest';
import { clusterNeighbors, clustersOf, isFilled, isSurrounded } from './mapGrid';
import { makeLayout } from './mapLayout';
import { c, emptyLayout, grid } from './testHelpers';

describe('Hilfsfunktionen für die Wertung', () => {
  const layout = makeLayout({ id: 'x', name: 'x', mountains: [c(1, 1)], ruins: [c(2, 2)], wasteland: [c(3, 3)] });

  it('gefüllt sind Gelände, Berge und Ödland, aber keine leeren Ruinen', () => {
    const g = grid(layout, { forest: [c(0, 0)] });
    expect(isFilled(g, c(0, 0))).toBe(true);
    expect(isFilled(g, c(1, 1))).toBe(true);
    expect(isFilled(g, c(3, 3))).toBe(true);
    expect(isFilled(g, c(2, 2))).toBe(false);
    expect(isFilled(g, c(5, 5))).toBe(false);
    expect(isFilled(grid(layout, { farm: [c(2, 2)] }), c(2, 2))).toBe(true);
  });

  it('der Kartenrand zählt bei „umgeben“ wie ein gefülltes Feld', () => {
    expect(isSurrounded(grid(emptyLayout, { water: [c(0, 1), c(1, 0)] }), c(0, 0))).toBe(true);
    expect(isSurrounded(grid(), c(0, 0))).toBe(false);
  });

  it('findet zusammenhängende Gebiete, diagonal zählt nicht', () => {
    const g = grid(emptyLayout, { village: [c(0, 0), c(0, 1), c(1, 1), c(3, 3), c(4, 4)] });
    const sizes = clustersOf(g, 'village').map((cl) => cl.length).sort();
    expect(sizes).toEqual([1, 1, 3]);
  });

  it('Nachbarn eines Gebiets ohne die eigenen Felder', () => {
    const g = grid(emptyLayout, { village: [c(5, 5), c(5, 6)] });
    expect(clusterNeighbors(g, clustersOf(g, 'village')[0]!)).toHaveLength(6);
  });
});
