import { describe, expect, it } from 'vitest';
import { allCoordinates } from '../mapGrid';
import { makeLayout } from '../mapLayout';
import { DECREES, SEASON_DECREES, SEASONS } from '../season';
import { c, emptyLayout, grid, sampleDecrees } from '../testHelpers';
import { SCORING_CARD_IDS, SCORING_CATEGORIES } from './cardIds';
import { cardsInCategory, SCORING_CARDS } from './catalog';
import { isCompleteAssignment, monsterPenalty, scoreSeason, seasonTotal } from './engine';
import { cardName } from './scoringCard';

describe('Jahreszeiten → Dekrete', () => {
  it('ordnet die Dekrete zu', () => {
    expect(SEASON_DECREES.spring).toEqual(['A', 'B']);
    expect(SEASON_DECREES.summer).toEqual(['B', 'C']);
    expect(SEASON_DECREES.autumn).toEqual(['C', 'D']);
    expect(SEASON_DECREES.winter).toEqual(['D', 'A']);
  });

  it('wertet jedes Dekret genau zweimal pro Spiel', () => {
    const all = SEASONS.flatMap((s) => SEASON_DECREES[s]);
    for (const decree of DECREES) expect(all.filter((d) => d === decree)).toHaveLength(2);
  });
});

describe('Monster', () => {
  it('zählt leere Nachbarn', () => {
    expect(monsterPenalty(grid(emptyLayout, { monster: [c(5, 5)] }))).toBe(-4);
  });

  it('Monster in der Ecke hat zwei Nachbarn', () => {
    expect(monsterPenalty(grid(emptyLayout, { monster: [c(0, 0)] }))).toBe(-2);
  });

  it('gefüllte Nachbarn zählen nicht', () => {
    const g = grid(emptyLayout, { monster: [c(5, 5)], forest: [c(4, 5), c(6, 5)], water: [c(5, 4)] });
    expect(monsterPenalty(g)).toBe(-1);
  });

  it('ein gemeinsamer leerer Nachbar zählt nur einmal', () => {
    // (5,5) ist leer und grenzt an beide Monster → 7 verschiedene Felder.
    expect(monsterPenalty(grid(emptyLayout, { monster: [c(5, 4), c(5, 6)] }))).toBe(-7);
  });

  it('benachbarte Monster bestrafen sich nicht gegenseitig', () => {
    // (1,0), (1,1), (0,2)
    expect(monsterPenalty(grid(emptyLayout, { monster: [c(0, 0), c(0, 1)] }))).toBe(-3);
  });

  it('ein Berg neben dem Monster ist nicht leer', () => {
    const layout = makeLayout({ id: 'm', name: 'm', mountains: [c(5, 6)], ruins: [] });
    expect(monsterPenalty(grid(layout, { monster: [c(5, 5)] }))).toBe(-3);
  });

  it('eine leere Ruine neben dem Monster zählt', () => {
    const layout = makeLayout({ id: 'r', name: 'r', mountains: [], ruins: [c(5, 6)] });
    expect(monsterPenalty(grid(layout, { monster: [c(5, 5)] }))).toBe(-4);
  });

  it('ohne Monster keine Minuspunkte', () => {
    expect(monsterPenalty(grid())).toBe(0);
  });
});

describe('Jahreszeitenwertung', () => {
  it('Frühling wertet A und B plus Gold und Monster', () => {
    const g = grid(emptyLayout, { forest: [c(0, 0), c(0, 1), c(5, 5)], monster: [c(10, 10)] });
    const score = scoreSeason('spring', g, sampleDecrees, 3);

    expect(score.decreeScores.map((d) => d.decree)).toEqual(['A', 'B']);
    expect(score.decreeScores[0]?.card).toBe('sentinelWood');
    expect(score.decreeScores[0]?.points).toBe(2);
    expect(score.decreeScores[1]?.points).toBe(0); // Platzhalter
    expect(score.gold).toBe(3);
    expect(score.monsterPenalty).toBe(-2);
    expect(seasonTotal(score)).toBe(2 + 0 + 3 - 2);
  });

  it('Sommer wertet Dekret A nicht', () => {
    const score = scoreSeason('summer', grid(emptyLayout, { forest: [c(0, 0)] }), sampleDecrees, 0);
    expect(score.decreeScores.map((d) => d.decree)).toEqual(['B', 'C']);
    expect(seasonTotal(score)).toBe(0);
  });

  it('Winter wertet D, dann A', () => {
    const score = scoreSeason('winter', grid(emptyLayout, { forest: [c(0, 0)] }), sampleDecrees, 0);
    expect(score.decreeScores.map((d) => d.decree)).toEqual(['D', 'A']);
    expect(seasonTotal(score)).toBe(1);
  });

  it('nutzt einen übergebenen Katalog', () => {
    const fixed = (id: (typeof SCORING_CARD_IDS)[number]) => ({
      id,
      category: 'spatial' as const,
      ruleText: 'fix',
      isImplemented: true,
      score: () => 5,
    });
    expect(seasonTotal(scoreSeason('autumn', grid(), sampleDecrees, 0, fixed))).toBe(10);
  });

  it('die Summe kann negativ sein', () => {
    const score = scoreSeason('summer', grid(emptyLayout, { monster: [c(5, 5)] }), sampleDecrees, 1);
    expect(seasonTotal(score)).toBe(-3);
  });
});

describe('Katalog und Platzhalter', () => {
  it('enthält jede Karte genau einmal', () => {
    expect(SCORING_CARDS).toHaveLength(SCORING_CARD_IDS.length);
    expect(new Set(SCORING_CARDS.map((card) => card.id))).toEqual(new Set(SCORING_CARD_IDS));
  });

  it('vier Karten pro Kategorie', () => {
    for (const category of SCORING_CATEGORIES) expect(cardsInCategory(category)).toHaveLength(4);
  });

  it('Platzhalter sind markiert und liefern 0', () => {
    const full = grid(emptyLayout, { forest: allCoordinates(grid()) });
    for (const card of SCORING_CARDS.filter((x) => !x.isImplemented)) {
      expect(card.score(full), cardName(card)).toBe(0);
      expect(card.ruleText, cardName(card)).toContain('Platzhalter');
    }
  });
});

describe('Dekret-Zuordnung', () => {
  it('erkennt vollständige Zuordnungen', () => {
    expect(isCompleteAssignment(sampleDecrees)).toBe(true);
    expect(isCompleteAssignment({ A: 'sentinelWood' })).toBe(false);
    expect(isCompleteAssignment({ A: 'sentinelWood', B: 'sentinelWood', C: 'wildholds', D: 'borderlands' })).toBe(false);
  });
});
