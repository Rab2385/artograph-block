import './ui/styles.css';
import { CustomMapStore, GameStore } from './core';
import { mountApp } from './ui/app';
import { GameController } from './ui/controller';

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  mountApp(root, new GameController(new GameStore(window.localStorage)), new CustomMapStore(window.localStorage));
}

// Offline-Betrieb: Der Service Worker wird nur im fertigen Build erzeugt (siehe build/serviceWorker.ts).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Ohne Service Worker läuft die App trotzdem, nur nicht offline.
    });
  });
}
