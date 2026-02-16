import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.BOOT);
  }

  preload(): void {
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Загрузка...', {
      fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
      fontSize: '28px',
      color: '#dfe6ff',
    }).setOrigin(0.5);

    for (let level = 1; level <= 5; level += 1) {
      this.load.image(`level${level}-back`, `/assets/levels/level${level}/back.png`);
      this.load.image(`level${level}-mid`, `/assets/levels/level${level}/mid.png`);
      this.load.image(`level${level}-front`, `/assets/levels/level${level}/front.png`);
    }
  }

  create(): void {
    this.createGeneratedTextures();
    this.scene.start(SceneKeys.HUB);
  }

  private createGeneratedTextures(): void {
    const g = this.add.graphics();

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(32, 32, 30);
    g.generateTexture('orb', 64, 64);

    g.clear();
    g.fillStyle(0x56c2ff, 1);
    g.fillCircle(42, 42, 30);
    g.fillStyle(0xb8ecff, 1);
    g.fillCircle(34, 34, 18);
    g.generateTexture('resource', 84, 84);

    g.clear();
    g.fillStyle(0x1e2f6f, 1);
    g.fillRoundedRect(0, 0, 84, 84, 16);
    g.fillStyle(0xdde8ff, 1);
    g.fillCircle(42, 34, 18);
    g.fillStyle(0x11182f, 1);
    g.fillRect(26, 52, 32, 20);
    g.generateTexture('player', 84, 84);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(128, 128, 100);
    g.generateTexture('glow', 256, 256);

    g.destroy();
  }
}
