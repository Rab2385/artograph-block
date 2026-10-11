import { describe, expect, it } from 'vitest';
import { UndoHistory } from './undoHistory';

describe('UndoHistory', () => {
  it('liefert Schnappschüsse in umgekehrter Reihenfolge', () => {
    const history = new UndoHistory<number>();
    history.record(1);
    history.record(2);
    expect(history.popLast()).toBe(2);
    expect(history.popLast()).toBe(1);
    expect(history.popLast()).toBeUndefined();
  });

  it('verwirft beim Limit die ältesten', () => {
    const history = new UndoHistory<number>(2);
    [1, 2, 3].forEach((v) => history.record(v));
    expect(history.count).toBe(2);
    expect(history.popLast()).toBe(3);
    expect(history.popLast()).toBe(2);
  });

  it('fasst gleiche aufeinanderfolgende Schnappschüsse zusammen', () => {
    const history = new UndoHistory<number>();
    history.record(1);
    history.record(1);
    expect(history.count).toBe(1);
  });
});
