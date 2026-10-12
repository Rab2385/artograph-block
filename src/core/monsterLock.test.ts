import { describe, expect, it } from 'vitest';
import { canPaint, cellAt, erase, isLocked, paint } from './mapGrid';
import { c, emptyLayout, grid } from './testHelpers';

describe('Monster sind festgeschrieben', () => {
  it('Monsterfelder lassen sich nicht radieren', () => {
    const g = grid(emptyLayout, { monster: [c(3, 3)] });
    expect(isLocked(g, c(3, 3))).toBe(true);
    expect(erase(g, [c(3, 3)])).toBe(g);
  });

  it('Monsterfelder lassen sich nicht übermalen', () => {
    const g = grid(emptyLayout, { monster: [c(3, 3)] });
    expect(paint(g, [c(3, 3)], 'forest')).toBe(g);
    expect(cellAt(g, c(3, 3)).terrain).toBe('monster');
  });

  it('Monster kommen nur auf leere Felder', () => {
    const g = grid(emptyLayout, { forest: [c(3, 3)] });
    expect(canPaint(g, c(3, 3), 'monster')).toBe(false);
    const painted = paint(g, [c(3, 3), c(3, 4)], 'monster');
    expect(cellAt(painted, c(3, 3)).terrain).toBe('forest');
    expect(cellAt(painted, c(3, 4)).terrain).toBe('monster');
  });

  it('andere Felder daneben bleiben normal änderbar', () => {
    const g = grid(emptyLayout, { monster: [c(3, 3)], forest: [c(3, 4)] });
    const erased = erase(g, [c(3, 3), c(3, 4)]);
    expect(cellAt(erased, c(3, 3)).terrain).toBe('monster');
    expect(cellAt(erased, c(3, 4)).terrain).toBeNull();
  });
});
