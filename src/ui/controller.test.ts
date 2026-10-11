import { describe, expect, it } from 'vitest';
import { cellAt, currentSeason, GameStore } from '../core';
import { c, emptyLayout, sampleDecrees } from '../core/testHelpers';
import { GameController } from './controller';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

function started() {
  const store = new GameStore(memoryStorage());
  const controller = new GameController(store);
  controller.startNewGame({ layout: emptyLayout, decrees: sampleDecrees, playerName: '' });
  return { controller, store };
}

describe('GameController', () => {
  it('startet ohne gespeichertes Spiel leer', () => {
    expect(new GameController(new GameStore(memoryStorage())).state).toBeNull();
  });

  it('meldet einen unlesbaren Spielstand, statt abzustürzen', () => {
    const storage = memoryStorage();
    const store = new GameStore(storage);
    storage.setItem(store.key, '{kaputt');
    const controller = new GameController(store);
    expect(controller.state).toBeNull();
    expect(controller.errorMessage).not.toBeNull();
  });

  it('malt die markierten Felder und speichert', () => {
    const { controller, store } = started();
    controller.setPending([c(0, 0), c(0, 1)]);
    controller.paintPending('forest');
    expect(controller.pending).toBeNull();
    expect(cellAt(controller.state!.grid, c(0, 1)).terrain).toBe('forest');
    expect(store.load()).toEqual(controller.state);
  });

  it('macht Malen, Gold und Jahreszeitenwertung rückgängig', () => {
    const { controller } = started();
    controller.setPending([c(0, 0)]);
    controller.paintPending('forest');
    controller.adjustGold(2);
    controller.endCurrentSeason();
    expect(currentSeason(controller.state!)).toBe('summer');

    controller.undo();
    expect(currentSeason(controller.state!)).toBe('spring');
    controller.undo();
    expect(controller.state!.gold).toBe(0);
    controller.undo();
    expect(cellAt(controller.state!.grid, c(0, 0)).terrain).toBeNull();
    expect(controller.canUndo).toBe(false);
  });

  it('legt für Änderungen ohne Wirkung keinen Undo-Schritt an', () => {
    const { controller } = started();
    controller.adjustGold(-1); // Gold ist schon 0
    controller.erase([c(3, 3)]); // Feld ist schon leer
    expect(controller.canUndo).toBe(false);
  });

  it('Werkzeugwechsel verwirft die Auswahl', () => {
    const { controller } = started();
    controller.setPending([c(1, 1)]);
    controller.selectTool('erase');
    expect(controller.pending).toBeNull();
  });

  it('neues Blatt behält Karte und Wertungskarten, leert aber Undo', () => {
    const { controller } = started();
    controller.adjustGold(1);
    controller.resetSheet();
    expect(controller.state!.gold).toBe(0);
    expect(controller.state!.decrees).toEqual(sampleDecrees);
    expect(controller.canUndo).toBe(false);
  });

  it('benachrichtigt Beobachter', () => {
    const { controller } = started();
    let calls = 0;
    const unsubscribe = controller.subscribe(() => calls++);
    controller.adjustGold(1);
    unsubscribe();
    controller.adjustGold(1);
    expect(calls).toBe(1);
  });
});
