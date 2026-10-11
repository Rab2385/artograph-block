import { describe, expect, it } from 'vitest';
import {
  adjustGold,
  createGame,
  currentSeason,
  endCurrentSeason,
  isFinished,
  totalScore,
} from './gameState';
import { GameStore } from './gameStore';
import { paint } from './mapGrid';
import { STANDARD_LAYOUT } from './mapLayout';
import { seasonTotal } from './scoring/engine';
import { SEASONS } from './season';
import { c, emptyLayout, sampleDecrees } from './testHelpers';

function lastTotal(state: ReturnType<typeof createGame>): number {
  return seasonTotal(state.seasonScores[state.seasonScores.length - 1]!);
}

describe('GameState', () => {
  it('sammelt vier Jahreszeiten', () => {
    let state = createGame({ layout: emptyLayout, decrees: sampleDecrees });
    expect(currentSeason(state)).toBe('spring');

    state = { ...state, grid: paint(state.grid, [c(0, 0), c(0, 1)], 'forest') }; // A: 2 Punkte
    state = adjustGold(state, 1);
    state = endCurrentSeason(state);
    expect(lastTotal(state)).toBe(2 + 1); // Frühling A+B
    expect(currentSeason(state)).toBe('summer');

    state = endCurrentSeason(state);
    expect(lastTotal(state)).toBe(1); // Sommer B+C (kein Wasser, Acker, Dorf) + Gold
    state = { ...state, grid: paint(state.grid, [c(10, 10)], 'monster') }; // -2
    state = endCurrentSeason(state);
    expect(lastTotal(state)).toBe(1 - 2); // Herbst C+D
    state = endCurrentSeason(state);
    expect(lastTotal(state)).toBe(2 + 1 - 2); // Winter D+A

    expect(isFinished(state)).toBe(true);
    expect(currentSeason(state)).toBeNull();
    expect(endCurrentSeason(state)).toBe(state);
    expect(totalScore(state)).toBe(3 + 1 - 1 + 1);
    expect(state.seasonScores.map((s) => s.season)).toEqual([...SEASONS]);
  });

  it('Gold wird nie negativ', () => {
    const state = adjustGold(createGame({ layout: emptyLayout, decrees: sampleDecrees }), -3);
    expect(state.gold).toBe(0);
  });

  it('übersteht JSON hin und zurück', () => {
    let state = createGame({ layout: STANDARD_LAYOUT, decrees: sampleDecrees, playerName: 'Robert' });
    state = { ...state, grid: paint(state.grid, [c(0, 0)], 'forest') };
    state = endCurrentSeason(adjustGold(state, 2));
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});

describe('GameStore', () => {
  function memoryStorage() {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
  }

  it('speichert und lädt', () => {
    const store = new GameStore(memoryStorage());
    expect(store.load()).toBeNull();

    const state = createGame({ decrees: sampleDecrees });
    store.save(state);
    expect(store.load()).toEqual(state);

    store.delete();
    expect(store.load()).toBeNull();
  });

  it('lehnt ein unbekanntes Format ab', () => {
    const storage = memoryStorage();
    const store = new GameStore(storage);
    storage.setItem(store.key, JSON.stringify({ formatVersion: 99 }));
    expect(() => store.load()).toThrow();
  });
});
