import { GAME_FORMAT_VERSION, type GameState } from './gameState';

/** Teil der Web-Storage-API, den der Speicher braucht (zum Testen austauschbar). */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Speichert das laufende Spiel als JSON, standardmäßig in `localStorage`.
 *
 * Hinweis: Safari kann Website-Daten nach rund 7 Tagen ohne Nutzung löschen,
 * außer die Seite liegt auf dem Homescreen.
 */
export class GameStore {
  constructor(
    private readonly storage: KeyValueStorage,
    readonly key = 'kartograph-block:current-game',
  ) {}

  /** Liefert `null`, wenn nichts gespeichert ist; wirft bei unlesbaren Daten. */
  load(): GameState | null {
    const json = this.storage.getItem(this.key);
    if (json === null) return null;
    const state = JSON.parse(json) as GameState;
    if (state.formatVersion !== GAME_FORMAT_VERSION) {
      throw new Error(`Unbekanntes Spielstand-Format ${String(state.formatVersion)}`);
    }
    return state;
  }

  save(state: GameState): void {
    this.storage.setItem(this.key, JSON.stringify(state));
  }

  delete(): void {
    this.storage.removeItem(this.key);
  }
}
