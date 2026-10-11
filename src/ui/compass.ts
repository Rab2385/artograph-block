import { TERRAIN_NAMES, TERRAINS, type Terrain } from '../core';
import { hatchPatterns, icon } from './icons';

/** Durchmesser des Kompasses in CSS-Pixeln. */
export const COMPASS_SIZE = 300;
const MEDALLION = 76;
const ORBIT = 104;
const GAP = 16;

export interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/**
 * Wo der Kompass hinkommt: neben die Auswahl, damit sie sichtbar bleibt.
 * Reihenfolge rechts, links, unten, oben; immer vollständig im Fenster.
 */
export function placeCompass(selection: Box, viewport: { width: number; height: number }, size = COMPASS_SIZE) {
  const midX = (selection.left + selection.right) / 2 - size / 2;
  const midY = (selection.top + selection.bottom) / 2 - size / 2;
  const candidates = [
    { left: selection.right + GAP, top: midY },
    { left: selection.left - GAP - size, top: midY },
    { left: midX, top: selection.bottom + GAP },
    { left: midX, top: selection.top - GAP - size },
  ];
  const fitsAcross = (p: { left: number }) => p.left >= 0 && p.left + size <= viewport.width;
  const fitsDown = (p: { top: number }) => p.top >= 0 && p.top + size <= viewport.height;
  // Seitlich darf der Kompass in der Höhe verschoben werden, darunter/darüber nicht.
  const chosen =
    candidates.slice(0, 2).find(fitsAcross) ??
    candidates.slice(2).find((p) => fitsAcross(p) && fitsDown(p)) ??
    candidates[0]!;
  return {
    left: clamp(chosen.left, 0, viewport.width - size),
    top: clamp(chosen.top, 0, viewport.height - size),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** Markup des Kompasses: fünf Medaillons, in der Mitte Abbrechen mit der Felderzahl. */
export function compassMarkup(cellCount: number, position: { left: number; top: number }): string {
  const r = COMPASS_SIZE / 2;
  const medallions = TERRAINS.map((t: Terrain, i) => {
    const angle = (i / TERRAINS.length) * 2 * Math.PI - Math.PI / 2;
    const x = r + Math.cos(angle) * ORBIT - MEDALLION / 2;
    const y = r + Math.sin(angle) * ORBIT - MEDALLION / 2;
    return (
      `<button type="button" class="medallion" data-action="paint" data-terrain="${t}" ` +
      `style="left:${x}px;top:${y}px" aria-label="${TERRAIN_NAMES[t]}">` +
      `<svg class="medallion-fill" viewBox="0 0 ${MEDALLION} ${MEDALLION}" aria-hidden="true"><circle cx="${MEDALLION / 2}" cy="${MEDALLION / 2}" r="${MEDALLION / 2}" fill="url(#compass-${t})"/></svg>` +
      `${icon(t, 'medallion-icon')}<span class="medallion-label">${TERRAIN_NAMES[t]}</span></button>`
    );
  }).join('');
  return (
    `<button type="button" class="compass-backdrop" data-action="cancel-pending" aria-label="Auswahl abbrechen"></button>` +
    `<div class="compass" role="dialog" aria-label="Gelände wählen" style="left:${position.left}px;top:${position.top}px">` +
    compassRose() +
    medallions +
    `<button type="button" class="compass-cancel" data-action="cancel-pending" aria-label="Abbrechen">` +
    `${icon('close', 'compass-cancel-icon')}<span>${cellCount === 1 ? '1 Feld' : `${cellCount} Felder`}</span></button>` +
    `</div>`
  );
}

/** Die Kompassrose hinter den Medaillons, nur Schmuck. */
function compassRose(): string {
  const r = COMPASS_SIZE / 2;
  let star = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const long = i % 2 === 0;
    const len = long ? r - 12 : r - 52;
    const w = long ? 14 : 9;
    const tip = [Math.cos(a) * len, Math.sin(a) * len];
    const left = [Math.cos(a - Math.PI / 2) * w, Math.sin(a - Math.PI / 2) * w];
    const right = [Math.cos(a + Math.PI / 2) * w, Math.sin(a + Math.PI / 2) * w];
    star += `<path d="M${left.join(' ')}L${tip.join(' ')}L${right.join(' ')}Z" fill="${long ? '#D2BC8C' : '#E2D0A6'}" stroke="#3A2A1A" stroke-opacity="0.35"/>`;
  }
  return (
    `<svg class="compass-rose" viewBox="${-r} ${-r} ${COMPASS_SIZE} ${COMPASS_SIZE}" aria-hidden="true">` +
    `<defs>${hatchPatterns('compass-')}</defs>` +
    `<circle r="${r - 1.5}" fill="#F3E7C9" stroke="#3A2A1A" stroke-width="2.5"/>` +
    `<circle r="${r - 8}" fill="none" stroke="#3A2A1A" stroke-width="1"/>` +
    `<g opacity="0.75">${star}</g>` +
    `<text y="${-r + 24}" text-anchor="middle" class="compass-north">N</text>` +
    `</svg>`
  );
}
