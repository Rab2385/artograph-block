// Vorläufige Startseite: Die Oberfläche (#10, #11) folgt im nächsten Schritt von #14.
// Bis dahin zeigt die Seite nur, dass der portierte Kern im Browser läuft.
import { createGame, currentSeasonPreview, seasonTotal, STANDARD_LAYOUT } from './core';

const game = createGame({
  layout: STANDARD_LAYOUT,
  decrees: { A: 'sentinelWood', B: 'canalLake', C: 'wildholds', D: 'borderlands' },
});
const preview = currentSeasonPreview(game);

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = `
    <h1>Kartograph-Block</h1>
    <p>Die Web-App ist im Aufbau. Spiellogik geladen: ${STANDARD_LAYOUT.name},
    Vorschau Frühling ${preview ? seasonTotal(preview) : '–'} Punkte.</p>`;
}
