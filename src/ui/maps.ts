import qrcode from 'qrcode-generator';
import {
  createGrid,
  decodeLayout,
  encodeLayout,
  newCustomId,
  printedFeatureAt,
  randomLayout,
  setFeature,
  TYPICAL_COUNTS,
  makeLayout,
  type Coordinate,
  type CustomMapStore,
  type MapLayout,
  type PrintedFeature,
} from '../core';
import { BoardView } from './board';
import { escapeHtml, icon } from './icons';

/** Was die Kartenverwaltung vom restlichen Bildschirm braucht. */
export interface MapScreensHost {
  readonly dialog: HTMLDialogElement;
  openDialog(html: string, className?: string): void;
  /** Zurück zum Dialog „Neues Spiel“; `selected` wird dort vorausgewählt. */
  backToSetup(selected?: MapLayout): void;
  /** Fertig ohne Rücksprung (z. B. nach einem geöffneten Link). */
  done(): void;
  showToast(text: string): void;
}

const LINK_PREFIX = '#karte=';
const FEATURE_NAMES: Record<PrintedFeature, string> = {
  mountain: 'Berg',
  ruins: 'Ruine',
  wasteland: 'Schlucht',
  free: 'Radierer',
};
const FEATURE_ICONS: Record<PrintedFeature, 'mountain' | 'ruins' | 'wasteland' | 'eraser'> = {
  mountain: 'mountain',
  ruins: 'ruins',
  wasteland: 'wasteland',
  free: 'eraser',
};

/** Link zum Teilen, z. B. `https://…/artograph-block/#karte=1Aw…~Name`. */
export function shareLink(layout: MapLayout, location: Pick<Location, 'origin' | 'pathname'>): string {
  return location.origin + location.pathname + LINK_PREFIX + encodeLayout(layout);
}

/** Karten-Code aus einem geöffneten Link, sonst `null`. */
export function codeFromHash(hash: string): string | null {
  return hash.startsWith(LINK_PREFIX) ? hash.slice(LINK_PREFIX.length) : null;
}

/**
 * Eigene Karten (#27): verwalten, neu zeichnen, teilen (Link und QR-Code),
 * löschen und aus einem Link übernehmen. Gespeicherte Karten sind fest.
 */
export class MapScreens {
  private draft: MapLayout | null = null;
  private tool: PrintedFeature = 'mountain';
  private editorBoard: BoardView | null = null;

  constructor(
    private readonly host: MapScreensHost,
    private readonly store: CustomMapStore,
  ) {
    host.dialog.addEventListener('click', (event) => {
      const target = (event.target as Element).closest<HTMLElement>('[data-map-action]');
      if (target && !(target as HTMLButtonElement).disabled) this.handle(target);
    });
  }

  // MARK: Übersicht

  openManager(): void {
    this.draft = null;
    const maps = this.store.list();
    const rows = maps.length
      ? maps
          .map(
            (l) => `
          <li class="map-row">
            ${miniMap(l)}
            <div class="map-info"><span class="map-name">${escapeHtml(l.name)}</span>
              <span class="hint">${countsText(l)}</span></div>
            <button type="button" class="button" data-map-action="share" data-id="${l.id}">Teilen</button>
            <button type="button" class="button danger" data-map-action="ask-delete" data-id="${l.id}">Löschen</button>
          </li>`,
          )
          .join('')
      : '<li class="hint">Noch keine eigenen Karten. Zeichne eine neue oder öffne einen geteilten Link.</li>';
    this.host.openDialog(
      `<div class="dialog-body maps">
        <h2 class="dialog-title">Eigene Karten</h2>
        <p class="hint">Gespeicherte Karten lassen sich nicht mehr ändern – nur teilen oder löschen.</p>
        <ul class="map-list">${rows}</ul>
        <div class="dialog-actions">
          <button type="button" class="button" data-map-action="back">Zurück</button>
          <button type="button" class="button primary" data-map-action="new">Neue Karte</button>
        </div>
      </div>`,
    );
  }

  // MARK: Editor

  openEditor(): void {
    this.draft = makeLayout({ id: newCustomId(), name: '', mountains: [], ruins: [] });
    this.tool = 'mountain';
    const tools = (['mountain', 'ruins', 'wasteland', 'free'] as const)
      .map(
        (f) =>
          `<button type="button" class="tool" data-map-action="tool" data-feature="${f}" aria-pressed="${f === this.tool}">` +
          `<span class="seal">${icon(FEATURE_ICONS[f])}</span>${FEATURE_NAMES[f]}</button>`,
      )
      .join('');
    this.host.openDialog(
      `<div class="dialog-body editor">
        <div class="editor-head">
          <h2 class="dialog-title">Neue Karte</h2>
          <input class="text-input" name="map-name" type="text" autocomplete="off" maxlength="40"
            placeholder="Name der Karte" aria-label="Name der Karte">
        </div>
        <div class="editor-main">
          <nav class="editor-tools" aria-label="Kartenwerkzeuge">${tools}</nav>
          <div class="editor-board"></div>
        </div>
        <p class="hint editor-counts" aria-live="polite"></p>
        <div class="dialog-actions">
          <button type="button" class="button" data-map-action="random">${icon('shuffle')} Zufällig</button>
          <button type="button" class="button" data-map-action="clear">Alles leeren</button>
          <span class="spacer"></span>
          <button type="button" class="button" data-map-action="cancel-editor">Abbrechen</button>
          <button type="button" class="button primary" data-map-action="save">Speichern</button>
        </div>
      </div>`,
      'wide',
    );
    this.editorBoard = new BoardView({
      accept: () => true,
      onStrokeStart: () => {},
      onSelect: (cells) => this.applyTool(cells),
    });
    this.host.dialog.querySelector('.editor-board')!.append(this.editorBoard.element);
    this.renderEditor();
  }

  /** Tippen auf ein Feld, das schon so ist, nimmt es wieder weg; Ziehen setzt alle Felder. */
  private applyTool(cells: readonly Coordinate[]): void {
    if (!this.draft) return;
    const first = cells[0];
    const toggleOff = cells.length === 1 && first && printedFeatureAt(this.draft, first) === this.tool;
    this.draft = setFeature(this.draft, cells, toggleOff ? 'free' : this.tool);
    this.renderEditor();
  }

  private renderEditor(): void {
    if (!this.draft || !this.editorBoard) return;
    this.editorBoard.render(createGrid(this.draft), [], '#8E2A22');
    for (const button of this.host.dialog.querySelectorAll<HTMLElement>('[data-map-action="tool"]')) {
      button.setAttribute('aria-pressed', String(button.dataset.feature === this.tool));
    }
    const counts = this.host.dialog.querySelector<HTMLElement>('.editor-counts')!;
    const { mountains, ruins } = this.draft;
    const unusual = mountains.length !== TYPICAL_COUNTS.mountains || ruins.length !== TYPICAL_COUNTS.ruins;
    counts.textContent =
      countsText(this.draft) +
      (unusual ? ` – auf dem Block sind es ${TYPICAL_COUNTS.mountains} Berge und ${TYPICAL_COUNTS.ruins} Ruinen.` : '');
  }

  private save(): void {
    if (!this.draft) return;
    const input = this.host.dialog.querySelector<HTMLInputElement>('[name="map-name"]')!;
    const name = input.value.trim() || `Eigene Karte ${this.store.list().length + 1}`;
    const layout = { ...this.draft, name };
    const same = this.store.findSame(layout);
    if (same) {
      this.host.showToast(`Diese Karte gibt es schon: „${same.name}“`);
      return;
    }
    this.store.add(layout);
    this.draft = null;
    this.host.showToast(`Karte „${name}“ gespeichert`);
    this.host.backToSetup(layout);
  }

  // MARK: Teilen und Löschen

  private openShare(layout: MapLayout): void {
    const link = shareLink(layout, window.location);
    const qr = qrcode(0, 'M');
    qr.addData(link);
    qr.make();
    const canShare = typeof navigator.share === 'function';
    this.host.openDialog(
      `<div class="dialog-body share">
        <h2 class="dialog-title">„${escapeHtml(layout.name)}“ teilen</h2>
        <p class="hint">Mit der Kamera des anderen iPads scannen oder den Link schicken.
          Die Karte wird dort gespeichert, nichts geht über einen Server.</p>
        <div class="qr" role="img" aria-label="QR-Code für die Karte">${qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true })}</div>
        <input class="text-input share-link" type="text" readonly value="${escapeHtml(link)}" aria-label="Link zur Karte">
        <div class="dialog-actions">
          <button type="button" class="button" data-map-action="manager">Zurück</button>
          <button type="button" class="button" data-map-action="copy">Link kopieren</button>
          ${canShare ? `<button type="button" class="button primary" data-map-action="native-share" data-id="${layout.id}">Teilen …</button>` : ''}
        </div>
      </div>`,
      'alert',
    );
  }

  private async copyLink(): Promise<void> {
    const input = this.host.dialog.querySelector<HTMLInputElement>('.share-link');
    if (!input) return;
    try {
      await navigator.clipboard.writeText(input.value);
      this.host.showToast('Link kopiert');
    } catch {
      input.select();
      this.host.showToast('Link markiert – jetzt kopieren');
    }
  }

  private nativeShare(layout: MapLayout): void {
    navigator
      .share({ title: `Kartograph-Karte „${layout.name}“`, url: shareLink(layout, window.location) })
      .catch(() => {
        // Abgebrochen: nichts zu tun.
      });
  }

  private openDeleteConfirm(layout: MapLayout): void {
    this.host.openDialog(
      `<div class="dialog-body">
        <h2 class="dialog-title">Karte löschen?</h2>
        <p>„${escapeHtml(layout.name)}“ wird von diesem iPad gelöscht.
          Ein laufendes Spiel auf dieser Karte bleibt erhalten.</p>
        <div class="dialog-actions">
          <button type="button" class="button" data-map-action="manager">Abbrechen</button>
          <button type="button" class="button primary" data-map-action="delete" data-id="${layout.id}">Löschen</button>
        </div>
      </div>`,
      'alert',
    );
  }

  // MARK: Link übernehmen

  /** Wird beim Start aufgerufen, wenn die App über einen geteilten Link geöffnet wurde. */
  openImport(code: string): void {
    const layout = decodeLayout(code);
    if (!layout) {
      this.message('Link ungültig', 'Aus diesem Link ließ sich keine Karte lesen.');
      return;
    }
    const same = this.store.findSame(layout);
    if (same) {
      this.message('Schon gespeichert', `Diese Karte ist schon da: „${same.name}“.`);
      return;
    }
    this.draft = layout;
    this.host.openDialog(
      `<div class="dialog-body">
        <h2 class="dialog-title">Karte übernehmen?</h2>
        <div class="import-preview">${miniMap(layout, 'mini-map large')}</div>
        <p><strong>${escapeHtml(layout.name)}</strong><br><span class="hint">${countsText(layout)}</span></p>
        <div class="dialog-actions">
          <button type="button" class="button" data-map-action="done">Abbrechen</button>
          <button type="button" class="button primary" data-map-action="import">Speichern</button>
        </div>
      </div>`,
      'alert',
    );
  }

  private message(title: string, text: string): void {
    this.host.openDialog(
      `<div class="dialog-body"><h2 class="dialog-title">${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p>
        <div class="dialog-actions"><button type="button" class="button" data-map-action="done">OK</button></div></div>`,
      'alert',
    );
  }

  // MARK: Eingaben

  private handle(target: HTMLElement): void {
    const layout = target.dataset.id ? this.store.get(target.dataset.id) : undefined;
    switch (target.dataset.mapAction) {
      case 'back':
        this.host.backToSetup();
        break;
      case 'manager':
        this.openManager();
        break;
      case 'new':
        this.openEditor();
        break;
      case 'tool':
        this.tool = target.dataset.feature as PrintedFeature;
        this.renderEditor();
        break;
      case 'random':
        if (this.draft) this.draft = randomLayout(this.draft.name, Math.random, this.draft.id);
        this.renderEditor();
        break;
      case 'clear':
        if (this.draft) this.draft = { ...this.draft, mountains: [], ruins: [], wasteland: [] };
        this.renderEditor();
        break;
      case 'cancel-editor':
        this.openManager();
        break;
      case 'save':
        this.save();
        break;
      case 'share':
        if (layout) this.openShare(layout);
        break;
      case 'copy':
        void this.copyLink();
        break;
      case 'native-share':
        if (layout) this.nativeShare(layout);
        break;
      case 'ask-delete':
        if (layout) this.openDeleteConfirm(layout);
        break;
      case 'delete':
        if (layout) {
          this.store.remove(layout.id);
          this.host.showToast(`Karte „${layout.name}“ gelöscht`);
        }
        this.openManager();
        break;
      case 'import':
        if (this.draft) {
          this.store.add(this.draft);
          this.host.showToast(`Karte „${this.draft.name}“ gespeichert`);
          this.draft = null;
        }
        this.openManager();
        break;
      case 'done':
        this.draft = null;
        this.host.done();
        break;
    }
  }
}

function countsText(layout: MapLayout): string {
  const parts = [
    plural(layout.mountains.length, 'Berg', 'Berge'),
    plural(layout.ruins.length, 'Ruine', 'Ruinen'),
  ];
  if (layout.wasteland.length > 0) parts.push(plural(layout.wasteland.length, 'Schluchtfeld', 'Schluchtfelder'));
  return parts.join(' · ');
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** Kleine Vorschau: Berge als Dreieck, Ruinen goldbraun, Schlucht grau. */
export function miniMap(layout: MapLayout, className = 'mini-map'): string {
  let s = '';
  for (const c of layout.wasteland) s += `<rect x="${c.column}" y="${c.row}" width="1" height="1" fill="#8A857C"/>`;
  for (const c of layout.ruins) {
    s += `<rect x="${c.column + 0.2}" y="${c.row + 0.2}" width="0.6" height="0.6" rx="0.1" fill="#9A6E1C"/>`;
  }
  for (const c of layout.mountains) {
    s += `<path d="M${c.column + 0.1} ${c.row + 0.85}L${c.column + 0.5} ${c.row + 0.15}L${c.column + 0.9} ${c.row + 0.85}Z" fill="#3A2A1A"/>`;
  }
  const n = layout.size;
  return `<svg class="${className}" viewBox="-0.2 -0.2 ${n + 0.4} ${n + 0.4}" aria-hidden="true">
    <rect width="${n}" height="${n}" fill="#F6EDD6" stroke="#3A2A1A" stroke-width="0.12"/>${s}</svg>`;
}
