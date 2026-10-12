import { describe, expect, it } from 'vitest';
import { adjustGold, createGame, currentSeasonPreview, mountainGold, totalGold, type GameState } from './gameState';
import { paint } from './mapGrid';
import { makeLayout } from './mapLayout';
import { c, sampleDecrees } from './testHelpers';

const layout = makeLayout({ id: 'g', name: 'g', mountains: [c(5, 5), c(0, 3)], ruins: [c(4, 5)] });
const around = [c(4, 5), c(6, 5), c(5, 4), c(5, 6)];

function game(): GameState {
  return createGame({ layout, decrees: sampleDecrees });
}

function withPaint(state: GameState, cells: ReturnType<typeof c>[]): GameState {
  return { ...state, grid: paint(state.grid, cells, 'forest') };
}

describe('Gold für eingekreiste Berge', () => {
  it('ein Berg mit vier gefüllten Nachbarn bringt 1 Gold', () => {
    expect(mountainGold(withPaint(game(), around))).toBe(1);
  });

  it('drei Nachbarn reichen nicht, auch keine leere Ruine', () => {
    expect(mountainGold(withPaint(game(), around.slice(1)))).toBe(0);
  });

  it('am Kartenrand zählt der Rand mit', () => {
    expect(mountainGold(withPaint(game(), [c(0, 2), c(0, 4), c(1, 3)]))).toBe(1);
  });

  it('wird zum von Hand eingetragenen Gold addiert und in der Wertung gezählt', () => {
    const state = adjustGold(withPaint(game(), around), 2);
    expect(totalGold(state)).toBe(3);
    expect(currentSeasonPreview(state)?.gold).toBe(3);
  });

  it('− verringert nur das von Hand eingetragene Gold', () => {
    const state = adjustGold(withPaint(game(), around), -1);
    expect(state.gold).toBe(0);
    expect(totalGold(state)).toBe(1);
  });

  it('Radieren nimmt das Berg-Gold wieder weg', () => {
    const state = withPaint(game(), around);
    expect(mountainGold({ ...state, grid: paint(state.grid, [c(6, 5)], null) })).toBe(0);
  });
});
