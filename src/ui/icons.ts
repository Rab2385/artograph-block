import type { Terrain } from '../core';

/**
 * Tintenzeichnungen im Stil des Spielblocks, je in einem 24 × 24 Feld.
 * Werden einmal als `<symbol>` ins Dokument gelegt und per `<use>` verwendet.
 */
const SYMBOLS = {
  forest:
    '<path d="M7 3L3 10h2.2L2.5 15h9L8.8 10H11z"/><path d="M7 15v3.5"/><path d="M16.5 6l-4 7h2.2l-2.7 5h9l-2.7-5H20z"/><path d="M16.5 18v3"/>',
  village:
    '<path d="M3 12l5-5 5 5v8H3z"/><path d="M6.5 20v-4h3v4"/><path d="M13 14l4-4 4 4v6h-8"/><path d="M8 7V4.5h2v2.5"/>',
  water:
    '<path d="M2.5 8c2-2 3.5-2 5.5 0s3.5 2 5.5 0 3.5-2 5.5 0 2.5 2 2.5 2"/><path d="M2.5 13c2-2 3.5-2 5.5 0s3.5 2 5.5 0 3.5-2 5.5 0 2.5 2 2.5 2"/><path d="M2.5 18c2-2 3.5-2 5.5 0s3.5 2 5.5 0 3.5-2 5.5 0 2.5 2 2.5 2"/>',
  farm:
    '<path d="M12 21.5V6"/><path d="M12 7c-2-1-2.5-3-2-4.5 1.5.5 2.5 2.5 2 4.5zM12 7c2-1 2.5-3 2-4.5-1.5.5-2.5 2.5-2 4.5z"/><path d="M12 11.5c-2.5-.5-3.5-2.5-3.2-4.2 1.8.3 3.2 2.2 3.2 4.2zM12 11.5c2.5-.5 3.5-2.5 3.2-4.2-1.8.3-3.2 2.2-3.2 4.2z"/><path d="M12 16c-2.5-.5-3.5-2.5-3.2-4.2 1.8.3 3.2 2.2 3.2 4.2zM12 16c2.5-.5 3.5-2.5 3.2-4.2-1.8.3-3.2 2.2-3.2 4.2z"/>',
  monster:
    '<path d="M5 10L6.5 3.5 10 8h4l3.5-4.5L19 10c1 5.5-2.5 10-7 10s-8-4.5-7-10z"/><path d="M8.5 12l2 1M15.5 12l-2 1"/><path d="M9 16.5l1.5-1 1.5 1 1.5-1 1.5 1"/>',
  mountain:
    '<path d="M1.5 20.5L9 6.5l3.5 6 3-4.5 7 12.5z" fill="#A88B64"/><path d="M9 6.5l-2.2 4.1 1.6-.8 1 1.2 1.2-1.4z" fill="#F6EDD6"/><path d="M5 17l2-3M13 17l1.5-2.5M17 17l1-1.8"/>',
  ruins:
    '<path d="M4.5 21V11a7.5 7.5 0 0 1 15 0v10h-3.2V11.5a4.3 4.3 0 0 0-8.6 0V21z" fill="#F6EDD6"/><path d="M12 3.5l-.8 3 1.3 1.5-.6 2"/><path d="M3 21h18"/>',
  wasteland: '<path d="M7 2l2 5-3 4 3 4-2 7"/><path d="M15 2l-1 6 3 3-3 5 2 6"/><path d="M9 7l2 1M6 11l-2 1M14 8l-2 1M17 11l2 0"/>',
  quill: '<path d="M20 3C13 4 7 10 5 19"/><path d="M20 3c-1 6-5 10-11 11"/><path d="M5 19l-2 2"/>',
  eraser:
    '<path d="M8 20h12"/><path d="M4.5 15.5l9-9a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L12 20H8.5z"/><path d="M9 11l5 5"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  seal: '<circle cx="12" cy="10" r="6"/><path d="M9 10l2 2 4-4"/><path d="M8.5 15L7 21l5-2 5 2-1.5-6"/>',
  scroll:
    '<path d="M6 4h11a2 2 0 0 1 2 2v12"/><path d="M6 4a2 2 0 0 0-2 2v1h4V6a2 2 0 0 0-2-2z"/><path d="M8 7v11a2 2 0 0 0 2 2h9a2 2 0 0 0 0-4h-8"/><path d="M11 9h5M11 12h5"/>',
  newSheet: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 8v8M8 12h8"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  shuffle:
    '<path d="M3 6h3.5c4.5 0 6.5 12 11 12H21"/><path d="M3 18h3.5c1.8 0 3-1.8 4.2-4M13.3 10C14.5 7.8 15.7 6 17.5 6H21"/><path d="M18.5 3.5L21 6l-2.5 2.5M18.5 15.5L21 18l-2.5 2.5"/>',
  grid: '<rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
} satisfies Record<string, string>;

export type IconName = keyof typeof SYMBOLS;

/** Unsichtbares SVG mit allen Symbolen; einmal in `<body>` einfügen. */
export function iconSprite(): string {
  const symbols = Object.entries(SYMBOLS)
    .map(
      ([name, body]) =>
        `<symbol id="i-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</symbol>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${symbols}</svg>`;
}

/** Ein Symbol als eigenes `<svg>` für HTML (Größe per CSS). */
export function icon(name: IconName, className = 'icon'): string {
  return `<svg class="${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

export const TERRAIN_COLORS: Record<Terrain, { fill: string; ink: string }> = {
  forest: { fill: '#5E8C4A', ink: '#36572A' },
  village: { fill: '#B4463A', ink: '#6E2219' },
  water: { fill: '#4A7FB0', ink: '#234B70' },
  farm: { fill: '#D9B348', ink: '#8A6A17' },
  monster: { fill: '#7B4D8E', ink: '#46275A' },
};

/** Buntstift-Schraffur je Geländeart als SVG-`<pattern>`; `prefix` macht die IDs eindeutig. */
export function hatchPatterns(prefix: string): string {
  return (Object.keys(TERRAIN_COLORS) as Terrain[])
    .map((t) => {
      const { fill, ink } = TERRAIN_COLORS[t];
      return (
        `<pattern id="${prefix}${t}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">` +
        `<rect width="6" height="6" fill="${fill}" fill-opacity="0.62"/>` +
        `<line x1="0" y1="1" x2="6" y2="1" stroke="${ink}" stroke-opacity="0.55" stroke-width="1.6"/>` +
        `<line x1="0" y1="4" x2="6" y2="4" stroke="${fill}" stroke-opacity="0.9" stroke-width="1"/>` +
        `</pattern>`
      );
    })
    .join('');
}

/** Schützt Text, der in HTML eingesetzt wird (z. B. den Spielernamen). */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
