import './ui/styles.css';
import { GameStore } from './core';
import { mountApp } from './ui/app';
import { GameController } from './ui/controller';

const root = document.querySelector<HTMLElement>('#app');
if (root) mountApp(root, new GameController(new GameStore(window.localStorage)));
