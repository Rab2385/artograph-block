import { describe, expect, it } from 'vitest';
import { coord } from '../../coordinate';
import { makeLayout } from '../../mapLayout';
import { c, emptyLayout, grid } from '../../testHelpers';
import { borderlands } from './borderlands';
import { brokenRoad } from './brokenRoad';
import { canalLake } from './canalLake';
import { cauldrons } from './cauldrons';
import { goldenGranary } from './goldenGranary';
import { greatCity } from './greatCity';
import { greenbough } from './greenbough';
import { greengoldPlains } from './greengoldPlains';
import { lostBarony } from './lostBarony';
import { magesValley } from './magesValley';
import { shieldgate } from './shieldgate';
import { shoresideExpanse } from './shoresideExpanse';
import { stonesideForest } from './stonesideForest';
import { treetower } from './treetower';
import { wildholds } from './wildholds';

const row = (r: number, from = 0, to = 10) => Array.from({ length: to - from + 1 }, (_, i) => c(r, from + i));
const column = (col: number, from = 0, to = 10) => Array.from({ length: to - from + 1 }, (_, i) => c(from + i, col));
const mountains = (...m: ReturnType<typeof c>[]) => makeLayout({ id: 'm', name: 'm', mountains: m, ruins: [] });

describe('Greenbough', () => {
  it('zählt Zeilen und Spalten mit Wald, ein Feld für beide', () => {
    expect(greenbough.score(grid(emptyLayout, { forest: [c(2, 3)] }))).toBe(2);
  });
  it('mehrere Waldfelder in derselben Zeile zählen die Zeile nur einmal', () => {
    expect(greenbough.score(grid(emptyLayout, { forest: [c(2, 3), c(2, 4)] }))).toBe(1 + 2);
  });
  it('leeres Raster bringt 0', () => {
    expect(greenbough.score(grid())).toBe(0);
  });
});

describe('Treetower', () => {
  it('Wald in der Ecke ist vom Rand und zwei gefüllten Feldern umgeben', () => {
    expect(treetower.score(grid(emptyLayout, { forest: [c(0, 0)], water: [c(0, 1), c(1, 0)] }))).toBe(1);
  });
  it('ein leerer Nachbar verhindert die Wertung', () => {
    expect(treetower.score(grid(emptyLayout, { forest: [c(0, 0)], water: [c(0, 1)] }))).toBe(0);
  });
  it('Berge zählen als gefüllt', () => {
    const g = grid(mountains(c(4, 5)), { forest: [c(5, 5)], farm: [c(6, 5), c(5, 4), c(5, 6)] });
    expect(treetower.score(g)).toBe(1);
  });
  it('leere Ruinen zählen nicht als gefüllt', () => {
    const layout = makeLayout({ id: 'r', name: 'r', mountains: [], ruins: [c(4, 5)] });
    const g = grid(layout, { forest: [c(5, 5)], farm: [c(6, 5), c(5, 4), c(5, 6)] });
    expect(treetower.score(g)).toBe(0);
  });
});

describe('Stoneside Forest', () => {
  it('zwei Berge über ein Waldgebiet verbunden: je 3 Punkte', () => {
    const g = grid(mountains(c(5, 2), c(5, 6)), { forest: [c(5, 3), c(5, 4), c(5, 5)] });
    expect(stonesideForest.score(g)).toBe(6);
  });
  it('ein Berg zählt höchstens einmal, auch mit mehreren Verbindungen', () => {
    // Mittelberg (5,5) ist mit (5,2) und (5,8) verbunden: 3 Berge × 3.
    const g = grid(mountains(c(5, 2), c(5, 5), c(5, 8)), { forest: [c(5, 3), c(5, 4), c(5, 6), c(5, 7)] });
    expect(stonesideForest.score(g)).toBe(9);
  });
  it('ein Wald an nur einem Berg bringt nichts', () => {
    expect(stonesideForest.score(grid(mountains(c(5, 2), c(5, 6)), { forest: [c(5, 3)] }))).toBe(0);
  });
  it('getrennte Waldgebiete verbinden nicht', () => {
    const g = grid(mountains(c(5, 2), c(5, 6)), { forest: [c(5, 3), c(5, 5)], water: [c(5, 4)] });
    expect(stonesideForest.score(g)).toBe(0);
  });
});

describe('Canal Lake', () => {
  it('Wasser neben Acker und Acker neben Wasser zählen beide', () => {
    expect(canalLake.score(grid(emptyLayout, { water: [c(3, 3)], farm: [c(3, 4)] }))).toBe(2);
  });
  it('jedes Feld zählt nur einmal, egal wie viele Nachbarn', () => {
    expect(canalLake.score(grid(emptyLayout, { water: [c(3, 3)], farm: [c(3, 4), c(3, 2)] }))).toBe(1 + 2);
  });
  it('diagonal zählt nicht', () => {
    expect(canalLake.score(grid(emptyLayout, { water: [c(3, 3)], farm: [c(4, 4)] }))).toBe(0);
  });
});

describe('Mages Valley', () => {
  it('2 Punkte je Wasser und 1 Punkt je Acker neben einem Berg', () => {
    const g = grid(mountains(c(5, 5)), { water: [c(4, 5), c(5, 4)], farm: [c(6, 5)], forest: [c(5, 6)] });
    expect(magesValley.score(g)).toBe(2 * 2 + 1);
  });
  it('ohne Berg in der Nähe nichts', () => {
    expect(magesValley.score(grid(mountains(c(5, 5)), { water: [c(0, 0)], farm: [c(9, 9)] }))).toBe(0);
  });
});

describe('The Golden Granary', () => {
  const ruins = makeLayout({ id: 'r', name: 'r', mountains: [], ruins: [c(5, 5), c(2, 2)] });
  it('1 Punkt je Wasser neben einer Ruine, 3 je Acker auf einer Ruine', () => {
    const g = grid(ruins, { water: [c(4, 5), c(5, 4)], farm: [c(2, 2)] });
    expect(goldenGranary.score(g)).toBe(2 + 3);
  });
  it('Wasser auf einer Ruine zählt nicht als „neben“', () => {
    expect(goldenGranary.score(grid(ruins, { water: [c(5, 5)] }))).toBe(0);
  });
});

describe('Shoreside Expanse', () => {
  it('Acker- und Wassergebiete ohne Kontakt zueinander und zum Rand', () => {
    const g = grid(emptyLayout, { farm: [c(3, 3), c(3, 4)], water: [c(7, 7)] });
    expect(shoresideExpanse.score(g)).toBe(6);
  });
  it('Kontakt zum Rand oder zur anderen Art zählt nicht', () => {
    const g = grid(emptyLayout, { farm: [c(0, 3), c(5, 5)], water: [c(5, 6)] });
    expect(shoresideExpanse.score(g)).toBe(0);
  });
});

describe('Wildholds', () => {
  it('8 Punkte je Dorfgebiet ab 6 Feldern', () => {
    const g = grid(emptyLayout, { village: [...row(1, 0, 5), ...row(5, 0, 4), ...row(8, 0, 6)] });
    expect(wildholds.score(g)).toBe(16);
  });
});

describe('Great City', () => {
  it('größtes Dorfgebiet ohne Berg-Kontakt', () => {
    // Das 5er-Gebiet grenzt an den Berg, also zählt das 3er-Gebiet.
    const g = grid(mountains(c(2, 5)), { village: [...row(1, 3, 7), ...row(8, 0, 2)] });
    expect(greatCity.score(g)).toBe(3);
  });
  it('ohne Dörfer 0', () => {
    expect(greatCity.score(grid())).toBe(0);
  });
});

describe('Greengold Plains', () => {
  it('3 Punkte je Dorfgebiet an mindestens drei Geländearten, Berg zählt mit', () => {
    const g = grid(mountains(c(4, 5)), { village: [c(5, 5), c(5, 6)], forest: [c(6, 5)], water: [c(5, 7)] });
    expect(greengoldPlains.score(g)).toBe(3);
  });
  it('zwei Geländearten reichen nicht', () => {
    const g = grid(emptyLayout, { village: [c(5, 5)], forest: [c(6, 5), c(4, 5)], water: [c(5, 4)] });
    expect(greengoldPlains.score(g)).toBe(0);
  });
});

describe('Shieldgate', () => {
  it('2 Punkte je Feld im zweitgrößten Dorfgebiet', () => {
    const g = grid(emptyLayout, { village: [...row(1, 0, 4), ...row(5, 0, 2), c(9, 9)] });
    expect(shieldgate.score(g)).toBe(6);
  });
  it('bei zwei gleich großen größten Gebieten zählt eins davon', () => {
    const g = grid(emptyLayout, { village: [...row(1, 0, 3), ...row(5, 0, 3)] });
    expect(shieldgate.score(g)).toBe(8);
  });
  it('nur ein Gebiet: 0', () => {
    expect(shieldgate.score(grid(emptyLayout, { village: row(1, 0, 3) }))).toBe(0);
  });
});

describe('Borderlands', () => {
  it('6 Punkte je volle Zeile oder Spalte, Berge zählen als gefüllt', () => {
    const g = grid(mountains(c(3, 4)), { forest: [...row(3, 0, 3), ...row(3, 5, 10), ...column(0)] });
    expect(borderlands.score(g)).toBe(12);
  });
  it('eine Lücke verhindert die Wertung', () => {
    expect(borderlands.score(grid(emptyLayout, { forest: row(3, 0, 9) }))).toBe(0);
  });
});

describe('The Lost Barony', () => {
  it('3 Punkte je Kantenfeld des größten gefüllten Quadrats', () => {
    const square = [0, 1, 2].flatMap((r) => [3, 4, 5].map((col) => c(r + 4, col)));
    expect(lostBarony.score(grid(emptyLayout, { farm: square }))).toBe(9);
  });
  it('Quadrate dürfen aus verschiedenen Geländearten und Bergen bestehen', () => {
    const g = grid(mountains(c(0, 0)), { forest: [c(0, 1)], water: [c(1, 0), c(1, 1)] });
    expect(lostBarony.score(g)).toBe(6);
  });
  it('ein einzelnes Feld ist ein 1×1-Quadrat', () => {
    expect(lostBarony.score(grid(emptyLayout, { forest: [c(5, 5)] }))).toBe(3);
  });
});

describe('The Broken Road', () => {
  const diagonal = (start: number) => Array.from({ length: 11 - start }, (_, i) => coord(start + i, i));
  it('3 Punkte je volle Diagonale vom linken zum unteren Rand', () => {
    expect(brokenRoad.score(grid(emptyLayout, { forest: [...diagonal(0), ...diagonal(10)] }))).toBe(6);
  });
  it('eine Lücke verhindert die Wertung', () => {
    expect(brokenRoad.score(grid(emptyLayout, { forest: diagonal(3).slice(1) }))).toBe(0);
  });
});

describe('The Cauldrons', () => {
  it('leere Felder, rundum gefüllt oder am Rand', () => {
    const g = grid(emptyLayout, { water: [c(0, 1), c(1, 0), c(4, 5), c(6, 5), c(5, 4), c(5, 6)] });
    // (0,0) in der Ecke und (5,5) in der Mitte.
    expect(cauldrons.score(g)).toBe(2);
  });
  it('Berge sind nicht leer, aber gefüllt', () => {
    const g = grid(mountains(c(5, 5)), { water: [c(4, 5), c(6, 5), c(5, 4), c(5, 6)] });
    expect(cauldrons.score(g)).toBe(0);
  });
});
