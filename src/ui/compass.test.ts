import { describe, expect, it } from 'vitest';
import { placeCompass } from './compass';

const viewport = { width: 1194, height: 834 };
const box = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom });

describe('placeCompass', () => {
  it('setzt den Kompass rechts neben die Auswahl', () => {
    const p = placeCompass(box(300, 300, 400, 360), viewport);
    expect(p.left).toBe(416);
    expect(p.top).toBe(330 - 150);
  });

  it('weicht nach links aus, wenn rechts kein Platz ist', () => {
    const p = placeCompass(box(1000, 300, 1100, 360), viewport);
    expect(p.left + 300).toBe(984);
  });

  it('bleibt am oberen Rand vollständig sichtbar', () => {
    const p = placeCompass(box(300, 0, 360, 60), viewport);
    expect(p.top).toBe(0);
    expect(p.left).toBe(376);
  });

  it('weicht auf schmalen Bildschirmen nach unten oder oben aus', () => {
    const narrow = { width: 400, height: 1000 };
    expect(placeCompass(box(150, 100, 250, 160), narrow)).toEqual({ left: 50, top: 176 });
    expect(placeCompass(box(150, 800, 250, 860), narrow)).toEqual({ left: 50, top: 484 });
  });

  it('bleibt immer im Fenster', () => {
    const tiny = { width: 320, height: 320 };
    const p = placeCompass(box(0, 0, 320, 320), tiny);
    expect(p.left).toBeGreaterThanOrEqual(0);
    expect(p.top).toBeGreaterThanOrEqual(0);
    expect(p.left + 300).toBeLessThanOrEqual(320);
    expect(p.top + 300).toBeLessThanOrEqual(320);
  });
});
