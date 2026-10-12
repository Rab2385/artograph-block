import {
  ALL_LAYOUTS,
  CARD_NAMES,
  cardById,
  cardName,
  cardsInCategory,
  CATEGORY_NAMES,
  currentSeason,
  currentSeasonPreview,
  DECREES,
  isCompleteAssignment,
  isFinished,
  canPaint,
  isLocked,
  isPaintable,
  layoutById,
  mountainGold,
  nextSeason,
  scoreFor,
  SCORING_CATEGORIES,
  SEASON_DECREES,
  SEASON_NAMES,
  SEASON_TIME_LIMITS,
  SEASONS,
  seasonTotal,
  STANDARD_LAYOUT,
  TERRAIN_NAMES,
  totalScore,
  type Coordinate,
  type DecreeAssignment,
  type GameState,
  type ScoringCardId,
  type ScoringCategory,
  type Season,
  type SeasonScore,
  type Terrain,
} from '../core';
import { BoardView } from './board';
import { compassMarkup, placeCompass } from './compass';
import type { GameController } from './controller';
import { escapeHtml, icon, iconSprite, type IconName } from './icons';

const DEFAULT_DECREES: DecreeAssignment = { A: 'sentinelWood', B: 'canalLake', C: 'wildholds', D: 'borderlands' };
const COIN_SLOTS = 14;
const SELECTION_DRAW = '#8E2A22';
const SELECTION_ERASE = '#3A2A1A';

const CATEGORY_ICONS: Record<ScoringCategory, IconName> = {
  forest: 'forest',
  waterFarm: 'water',
  village: 'village',
  spatial: 'grid',
};

/** Baut den Spielbildschirm auf und hält ihn mit dem Controller in Sync. */
export function mountApp(root: HTMLElement, controller: GameController): void {
  document.body.insertAdjacentHTML('afterbegin', iconSprite());
  root.innerHTML = `
    <div class="app">
      <nav class="toolbar" aria-label="Werkzeuge">
        ${toolButton('tool-draw', 'quill', 'Zeichnen')}
        ${toolButton('tool-erase', 'eraser', 'Radierer')}
        ${toolButton('undo', 'undo', 'Zurück')}
        <div class="rule"></div>
        ${toolButton('end-season', 'seal', 'Werten')}
        ${toolButton('show-score', 'scroll', 'Wertung')}
        ${toolButton('new-game', 'newSheet', 'Neu')}
      </nav>
      <div class="coinbar"></div>
      <div class="board-wrap"></div>
      <header class="head"></header>
      <section class="seasons" aria-label="Jahreszeiten"></section>
      <section class="cards" aria-label="Dekrete"></section>
    </div>
    <div class="overlay"></div>
    <div class="toast" role="status" hidden></div>
    <dialog class="dialog"></dialog>`;

  const q = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
  const coinbar = q<HTMLElement>('.coinbar');
  const head = q<HTMLElement>('.head');
  const seasons = q<HTMLElement>('.seasons');
  const cards = q<HTMLElement>('.cards');
  const overlay = q<HTMLElement>('.overlay');
  const toast = q<HTMLElement>('.toast');
  const dialog = q<HTMLDialogElement>('.dialog');
  let toastTimer: number | undefined;

  const board = new BoardView({
    // Monsterfelder sind gesperrt und lassen sich weder auswählen noch radieren.
    accept: (c) => controller.state !== null && isPaintable(controller.state.grid, c) && !isLocked(controller.state.grid, c),
    onStrokeStart: () => {
      hideToast();
      controller.cancelPending();
    },
    onSelect: (selected) => {
      if (controller.tool === 'erase') {
        controller.erase(selected);
        showToast(`${countText(selected.length)} radiert`);
      } else {
        controller.setPending(selected);
      }
    },
  });
  q<HTMLElement>('.board-wrap').append(board.element);

  // MARK: Darstellung

  function render(): void {
    const state = controller.state;
    if (controller.errorMessage) {
      const message = controller.errorMessage;
      controller.errorMessage = null;
      openAlert('Hinweis', message);
    }
    if (!state) {
      if (!dialog.open) openSetup(null);
      return;
    }
    renderToolbar(state);
    coinbar.innerHTML = coinbarMarkup(state.gold, mountainGold(state));
    head.innerHTML = headMarkup(state);
    seasons.innerHTML = SEASONS.map((s) => seasonMarkup(state, s)).join('');
    cards.innerHTML = '<h2>Dekrete</h2>' + DECREES.map((d) => cardMarkup(state, d)).join('');
    const pending = controller.pending ?? [];
    board.render(state.grid, pending, controller.tool === 'erase' ? SELECTION_ERASE : SELECTION_DRAW);
    renderCompass(pending);
  }

  function renderToolbar(state: GameState): void {
    setPressed('tool-draw', controller.tool === 'draw');
    setPressed('tool-erase', controller.tool === 'erase');
    setDisabled('undo', !controller.canUndo);
    setDisabled('end-season', isFinished(state));
  }

  function setPressed(action: string, pressed: boolean): void {
    q(`[data-action="${action}"]`).setAttribute('aria-pressed', String(pressed));
  }

  function setDisabled(action: string, disabled: boolean): void {
    q<HTMLButtonElement>(`[data-action="${action}"]`).disabled = disabled;
  }

  function renderCompass(pending: readonly Coordinate[]): void {
    if (pending.length === 0) {
      overlay.innerHTML = '';
      return;
    }
    const rect = board.screenRectOf(pending);
    const position = placeCompass(rect, { width: window.innerWidth, height: window.innerHeight });
    overlay.innerHTML = compassMarkup(pending.length, position);
    overlay.querySelector<HTMLButtonElement>('.medallion')?.focus({ preventScroll: true });
  }

  function showToast(text: string, withUndo = true): void {
    toast.innerHTML =
      `<span>${escapeHtml(text)}</span>` + (withUndo ? '<button type="button" data-action="undo">Zurück</button>' : '');
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, 4000);
  }

  function hideToast(): void {
    toast.hidden = true;
  }

  // MARK: Dialoge

  function openDialog(html: string, className = ''): void {
    dialog.className = `dialog ${className}`;
    dialog.innerHTML = html;
    if (!dialog.open) dialog.showModal();
  }

  function closeDialog(): void {
    if (dialog.open) dialog.close();
  }

  function openAlert(title: string, message: string): void {
    openDialog(
      `<div class="dialog-body"><h2 class="dialog-title">${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>` +
        `<div class="dialog-actions"><button type="button" class="button" data-action="close-dialog">OK</button></div></div>`,
      'alert',
    );
  }

  /** Trägt das gewählte Gelände in die markierten Felder ein und zeigt den Hinweis. */
  function paintSelection(terrain: Terrain): void {
    const state = controller.state;
    const pending = controller.pending ?? [];
    const count = state ? pending.filter((c) => canPaint(state.grid, c, terrain)).length : 0;
    const goldBefore = state ? mountainGold(state) : 0;
    controller.paintPending(terrain);
    const goldGained = controller.state ? mountainGold(controller.state) - goldBefore : 0;
    if (count === 0) return;
    const bonus = goldGained > 0 ? ` · Berg eingekreist: +${goldGained} Gold` : '';
    // Monster lassen sich nicht zurücknehmen, also ohne „Zurück“ im Hinweis.
    showToast(`${countText(count)} ${TERRAIN_NAMES[terrain]} eingetragen${bonus}`, terrain !== 'monster');
  }

  /**
   * Monster werden nur nach Bestätigung eingetragen; danach sind sie bis zum
   * Spielende festgeschrieben. Abbrechen führt zurück zum Kompass.
   */
  function openMonsterConfirm(): void {
    const state = controller.state;
    const pending = controller.pending ?? [];
    if (!state || pending.length === 0) return;
    const count = pending.filter((c) => canPaint(state.grid, c, 'monster')).length;
    const skipped = pending.length - count;
    const skippedNote =
      skipped > 0
        ? `<p class="hint">${countText(skipped)} ${skipped === 1 ? 'ist' : 'sind'} schon bemalt und ${skipped === 1 ? 'bleibt' : 'bleiben'} unverändert; Monster kommen nur auf leere Felder.</p>`
        : '';
    openDialog(
      `<div class="dialog-body">
        <h2 class="dialog-title">Monster eintragen?</h2>
        ${
          count > 0
            ? `<p><strong>${countText(count)}</strong> Monster. Monster lassen sich bis zum Spielende
               <strong>nicht mehr entfernen oder übermalen</strong>, auch nicht mit „Zurück“.</p>`
            : '<p>Keines der markierten Felder ist leer. Monster kommen nur auf leere Felder.</p>'
        }
        ${skippedNote}
        <div class="dialog-actions">
          <button type="button" class="button" data-action="close-dialog">Abbrechen</button>
          ${count > 0 ? '<button type="button" class="button primary" data-action="confirm-monster">Monster eintragen</button>' : ''}
        </div></div>`,
      'alert',
    );
  }

  function openSeasonConfirm(state: GameState): void {
    const season = currentSeason(state);
    const preview = currentSeasonPreview(state);
    if (!season || !preview) return;
    const next = nextSeason(season);
    openDialog(
      `<div class="dialog-body">
        <h2 class="dialog-title">${SEASON_NAMES[season]} werten?</h2>
        <p>Diese Jahreszeit bringt <strong>${signed(seasonTotal(preview))}</strong> Punkte.
        Danach geht es weiter mit ${next ? SEASON_NAMES[next] : 'dem Spielende'}.</p>
        <div class="dialog-actions">
          <button type="button" class="button" data-action="close-dialog">Abbrechen</button>
          <button type="button" class="button primary" data-action="confirm-end-season">Werten</button>
        </div></div>`,
      'alert',
    );
  }

  function openScoreSheet(state: GameState): void {
    openDialog(
      `<div class="dialog-body">
        <div class="dialog-actions" style="justify-content:space-between;align-items:center">
          <h2 class="dialog-title">Wertung</h2>
          <button type="button" class="button" data-action="close-dialog">Fertig</button>
        </div>
        ${scoreTableMarkup(state)}
        <div class="score-total"><span class="sc" style="font-size:24px">Gesamt</span>
          <div class="wax"><span class="value">${signed(totalScore(state))}</span></div></div>
        <div class="score-cards">${DECREES.map((d) => cardMarkup(state, d, false)).join('')}</div>
      </div>`,
    );
  }

  function openNewGameChoice(): void {
    openDialog(
      `<div class="dialog-body">
        <h2 class="dialog-title">Neues Spiel</h2>
        <p class="hint">Das aktuelle Blatt wird dabei verworfen.</p>
        <div class="choice-list">
          <button type="button" class="button" data-action="new-game-setup">Neues Spiel – Wertungskarten neu wählen</button>
          <button type="button" class="button danger" data-action="reset-sheet">Blatt leeren – gleiche Wertungskarten</button>
          <button type="button" class="button" data-action="close-dialog">Abbrechen</button>
        </div></div>`,
      'alert',
    );
  }

  function openSetup(previous: GameState | null): void {
    const decrees = previous?.decrees ?? DEFAULT_DECREES;
    const layoutId = previous?.layoutId ?? STANDARD_LAYOUT.id;
    openDialog(
      `<form class="dialog-body setup" method="dialog">
        <h2 class="dialog-title">Neues Spiel</h2>
        <label class="field"><span>Spieler</span>
          <input class="text-input" name="player" type="text" autocomplete="off" placeholder="Name (optional)" value="${escapeHtml(previous?.playerName ?? '')}">
        </label>
        <fieldset class="field"><legend>Karte</legend>
          <div class="segmented">${ALL_LAYOUTS.map(
            (l) =>
              `<label><input type="radio" name="layout" value="${l.id}"${l.id === layoutId ? ' checked' : ''}>${escapeHtml(l.name)}</label>`,
          ).join('')}</div>
        </fieldset>
        <fieldset class="field"><legend>Wertungskarten</legend>
          ${DECREES.map(
            (d) =>
              `<label class="decree-row"><span class="letter">${d}</span>
                <select class="select" name="decree-${d}" aria-label="Dekret ${d}">${cardOptions(decrees[d])}</select></label>`,
          ).join('')}
          <button type="button" class="button" data-action="shuffle">Zufällig ziehen (je eine Karte pro Kategorie)</button>
          <p class="hint setup-hint"></p>
        </fieldset>
        <div class="dialog-actions">
          ${previous ? '<button type="button" class="button" data-action="close-dialog">Abbrechen</button>' : ''}
          <button type="submit" class="button primary" data-action="start-game">Spiel starten</button>
        </div>
      </form>`,
    );
    validateSetup();
  }

  function setupForm(): HTMLFormElement | null {
    return dialog.querySelector<HTMLFormElement>('form.setup');
  }

  function readSetup(form: HTMLFormElement): DecreeAssignment {
    const decrees: DecreeAssignment = {};
    for (const d of DECREES) {
      decrees[d] = (form.elements.namedItem(`decree-${d}`) as HTMLSelectElement).value as ScoringCardId;
    }
    return decrees;
  }

  function validateSetup(): void {
    const form = setupForm();
    if (!form) return;
    const complete = isCompleteAssignment(readSetup(form));
    const hint = form.querySelector<HTMLElement>('.setup-hint')!;
    hint.textContent = complete
      ? 'Frühling wertet A+B, Sommer B+C, Herbst C+D, Winter D+A.'
      : 'Jede Wertungskarte darf nur einmal vorkommen.';
    hint.classList.toggle('error', !complete);
    form.querySelector<HTMLButtonElement>('[data-action="start-game"]')!.disabled = !complete;
  }

  function shuffleSetup(): void {
    const form = setupForm();
    if (!form) return;
    const drawn = SCORING_CATEGORIES.map((cat) => pick(cardsInCategory(cat)).id);
    shuffleInPlace(drawn);
    DECREES.forEach((d, i) => {
      (form.elements.namedItem(`decree-${d}`) as HTMLSelectElement).value = drawn[i]!;
    });
    validateSetup();
  }

  function startFromSetup(form: HTMLFormElement): void {
    const decrees = readSetup(form);
    if (!isCompleteAssignment(decrees)) return;
    const layoutId = (form.elements.namedItem('layout') as RadioNodeList).value;
    const playerName = (form.elements.namedItem('player') as HTMLInputElement).value.trim();
    closeDialog();
    controller.startNewGame({ layout: layoutById(layoutId) ?? STANDARD_LAYOUT, decrees, playerName });
  }

  // MARK: Eingaben

  root.addEventListener('click', (event) => {
    const target = (event.target as Element).closest<HTMLElement>('[data-action]');
    if (!target || (target as HTMLButtonElement).disabled) return;
    const state = controller.state;
    switch (target.dataset.action) {
      case 'tool-draw':
        controller.selectTool('draw');
        break;
      case 'tool-erase':
        controller.selectTool('erase');
        break;
      case 'undo':
        hideToast();
        controller.undo();
        break;
      case 'gold-plus':
        controller.adjustGold(1);
        break;
      case 'gold-minus':
        controller.adjustGold(-1);
        break;
      case 'paint': {
        const terrain = target.dataset.terrain as Terrain;
        if (terrain === 'monster') openMonsterConfirm();
        else paintSelection(terrain);
        break;
      }
      case 'confirm-monster':
        closeDialog();
        paintSelection('monster');
        break;
      case 'cancel-pending':
        controller.cancelPending();
        break;
      case 'end-season':
        if (state) openSeasonConfirm(state);
        break;
      case 'confirm-end-season':
        closeDialog();
        controller.endCurrentSeason();
        if (controller.state) openScoreSheet(controller.state);
        break;
      case 'show-score':
        if (state) openScoreSheet(state);
        break;
      case 'new-game':
        openNewGameChoice();
        break;
      case 'new-game-setup':
        openSetup(state);
        break;
      case 'reset-sheet':
        closeDialog();
        controller.resetSheet();
        break;
      case 'shuffle':
        shuffleSetup();
        break;
      case 'start-game': {
        event.preventDefault();
        const form = setupForm();
        if (form) startFromSetup(form);
        break;
      }
      case 'close-dialog':
        closeDialog();
        break;
    }
  });

  dialog.addEventListener('change', validateSetup);
  dialog.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = setupForm();
    if (form) startFromSetup(form);
  });
  // Ohne Spiel lässt sich der Setup-Dialog nicht wegdrücken.
  dialog.addEventListener('cancel', (event) => {
    if (!controller.state) event.preventDefault();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && controller.pending) controller.cancelPending();
  });
  window.addEventListener('resize', render);

  controller.subscribe(render);
  render();
}

// MARK: Bausteine

function toolButton(action: string, iconName: IconName, label: string): string {
  return `<button type="button" class="tool" data-action="${action}"><span class="seal">${icon(iconName)}</span>${label}</button>`;
}

/**
 * Goldleiste: erst die von Hand eingetragenen Münzen, dann die für eingekreiste
 * Berge (mit Siegelrand). − nimmt nur von Hand eingetragene Münzen weg.
 */
function coinbarMarkup(manual: number, mountain: number): string {
  const total = manual + mountain;
  const slots = Math.max(COIN_SLOTS, total);
  let coins = '';
  for (let i = 0; i < slots; i++) coins += coinSvg(i < total, i >= manual && i < total);
  const label = mountain > 0 ? `Gold: ${total}, davon ${mountain} für eingekreiste Berge` : `Gold: ${total}`;
  return `
    <span class="sc" style="font-size:17px">Gold</span>
    <div class="coins" aria-hidden="true">${coins}</div>
    <button type="button" class="round-button" data-action="gold-minus" aria-label="Gold verringern"${manual === 0 ? ' disabled' : ''}>${icon('minus')}</button>
    <span class="gold-value" aria-live="polite" aria-label="${label}">${total}</span>
    <button type="button" class="round-button" data-action="gold-plus" aria-label="Gold erhöhen">${icon('plus')}</button>`;
}

/** Münze wie auf dem Block: gefüllt in Gold oder als leerer Kreis; Berg-Gold mit Siegelrand. */
function coinSvg(filled: boolean, fromMountain = false): string {
  return filled
    ? '<svg class="coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#D9A93A" stroke="#3A2A1A" stroke-width="1.5"/>' +
        '<circle cx="12" cy="12" r="6.5" fill="none" stroke="#7A5512" stroke-width="1.3"/>' +
        '<path d="M12 8.5v7" stroke="#7A5512" stroke-width="1.5" stroke-linecap="round"/>' +
        (fromMountain ? '<circle cx="12" cy="12" r="11.3" fill="none" stroke="#8E2A22" stroke-width="1.6"/>' : '') +
        '</svg>'
    : '<svg class="coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#3A2A1A" stroke-width="1.5"/>' +
        '<circle cx="12" cy="12" r="6.5" fill="none" stroke="#3A2A1A" stroke-opacity="0.35"/></svg>';
}

function headMarkup(state: GameState): string {
  const layout = layoutById(state.layoutId)?.name ?? '';
  const player = state.playerName ? ` · ${escapeHtml(state.playerName)}` : '';
  return `
    <div><h1>Kartograph</h1><p>${escapeHtml(layout)}${player}</p></div>
    <button type="button" class="wax" data-action="show-score" aria-label="Gesamtpunkte ${totalScore(state)}, Wertung öffnen">
      <span class="label">Gesamt</span><span class="value">${signed(totalScore(state))}</span>
    </button>`;
}

function seasonMarkup(state: GameState, season: Season): string {
  const done = scoreFor(state, season);
  const isCurrent = currentSeason(state) === season;
  const score: SeasonScore | null = done ?? (isCurrent ? currentSeasonPreview(state) : null);
  const value = score ? `${done ? '' : '≈ '}${signed(seasonTotal(score))}` : '–';
  const className = isCurrent ? 'current' : done ? 'done' : 'future';
  return `
    <div class="season ${className}">
      ${isCurrent ? '<span class="ribbon">läuft</span>' : ''}
      <span class="name">${SEASON_NAMES[season]}</span>
      <span class="meta">${SEASON_DECREES[season].join(' · ')} · Zeit ${SEASON_TIME_LIMITS[season]}</span>
      <span class="value">${value}</span>
      <span class="meta">${score ? breakdown(score) : ''}</span>
    </div>`;
}

function breakdown(score: SeasonScore): string {
  const parts = score.decreeScores.map((d) => `${d.decree} ${signed(d.points)}`);
  parts.push(`Gold ${score.gold}`);
  if (score.monsterPenalty !== 0) parts.push(`Monster ${signed(score.monsterPenalty)}`);
  return parts.join(' · ');
}

function cardMarkup(state: GameState, decree: (typeof DECREES)[number], highlight = true): string {
  const id = state.decrees[decree];
  if (!id) return '';
  const card = cardById(id);
  const season = currentSeason(state);
  const active = highlight && season !== null && SEASON_DECREES[season].includes(decree);
  return `
    <div class="card${active ? ' active' : ''}">
      <div class="head-row"><span class="letter">${decree}</span><span class="points">${card.score(state.grid)}</span></div>
      <div class="text">
        <span class="title">${escapeHtml(cardName(card))}</span>
        <span class="rule-text">${escapeHtml(card.ruleText)}</span>
      </div>
      ${icon(CATEGORY_ICONS[card.category], 'category')}
    </div>`;
}

function scoreTableMarkup(state: GameState): string {
  const rows = SEASONS.map((season) => {
    const isCurrent = currentSeason(state) === season;
    const score = scoreFor(state, season) ?? (isCurrent ? currentSeasonPreview(state) : null);
    const [d1, d2] = SEASON_DECREES[season];
    if (!score) {
      return `<tr class="future"><th scope="row">${SEASON_NAMES[season]}</th>
        <td><span class="box"><span class="letter">${d1}</span></span></td>
        <td><span class="box"><span class="letter">${d2}</span></span></td>
        <td><span class="box"></span></td><td><span class="box"></span></td><td><span class="box sum"></span></td></tr>`;
    }
    const cells = score.decreeScores
      .map((d) => `<td><span class="box"><span class="letter">${d.decree}</span>${signed(d.points)}</span></td>`)
      .join('');
    return `<tr class="${isCurrent ? 'current' : ''}">
      <th scope="row">${SEASON_NAMES[season]}${isCurrent ? '<small>vorläufig</small>' : ''}</th>
      ${cells}
      <td><span class="box">${score.gold}</span></td>
      <td><span class="box">${signed(score.monsterPenalty)}</span></td>
      <td><span class="box sum">${signed(seasonTotal(score))}</span></td></tr>`;
  }).join('');
  return `<table class="score-table">
    <thead><tr><th scope="col">Jahreszeit</th><th scope="col">Dekret 1</th><th scope="col">Dekret 2</th>
      <th scope="col">Gold</th><th scope="col">Monster</th><th scope="col">Summe</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

function cardOptions(selected: ScoringCardId | undefined): string {
  return SCORING_CATEGORIES.map(
    (cat) =>
      `<optgroup label="${escapeHtml(CATEGORY_NAMES[cat])}">` +
      cardsInCategory(cat)
        .map(
          (card) =>
            `<option value="${card.id}"${card.id === selected ? ' selected' : ''}>` +
            `${escapeHtml(CARD_NAMES[card.id])}</option>`,
        )
        .join('') +
      '</optgroup>',
  ).join('');
}

/** Minuszeichen statt Bindestrich, wie gedruckt. */
function signed(value: number): string {
  return value < 0 ? `−${Math.abs(value)}` : String(value);
}

function countText(count: number): string {
  return count === 1 ? '1 Feld' : `${count} Felder`;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
}
