import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './game/config';
import { initTelegramWebApp } from './game/modules/telegram';

const APP_ID = 'app';

initTelegramWebApp();

const game = new Phaser.Game(createGameConfig(APP_ID));

function resizeGame(): void {
  const root = document.getElementById(APP_ID);
  if (!root) {
    return;
  }
  game.scale.resize(root.clientWidth, root.clientHeight);
}

window.addEventListener('resize', resizeGame);
window.visualViewport?.addEventListener('resize', resizeGame);
