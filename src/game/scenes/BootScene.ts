import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { CHARACTER_STAGE_MAX } from '../modules/character';

export class BootScene extends Phaser.Scene {
  private failedAssets = new Set<string>();

  constructor() {
    super(SceneKeys.BOOT);
  }

  preload(): void {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Загрузка...', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '28px',
        color: '#f4f8ff',
      })
      .setOrigin(0.5);

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: { key: string }) => {
      this.failedAssets.add(file.key);
    });

    for (let level = 1; level <= 5; level += 1) {
      this.load.image(`level${level}-back`, `/assets/levels/level${level}/back.png`);
      this.load.image(`level${level}-mid`, `/assets/levels/level${level}/mid.png`);
      this.load.image(`level${level}-front`, `/assets/levels/level${level}/front.png`);
    }

    for (let stage = 0; stage <= CHARACTER_STAGE_MAX; stage += 1) {
      this.load.image(`character-stage-${stage}`, `/assets/characters/stage${stage}.png`);
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
    g.fillStyle(0x7dd6ff, 1);
    g.fillCircle(42, 42, 30);
    g.fillStyle(0xe8faff, 1);
    g.fillCircle(34, 34, 18);
    g.generateTexture('resource', 84, 84);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(128, 128, 100);
    g.generateTexture('glow', 256, 256);

    g.clear();
    g.fillStyle(0x8de8b1, 1);
    g.fillEllipse(36, 38, 50, 30);
    g.fillStyle(0xd7ffd8, 1);
    g.fillEllipse(32, 34, 22, 12);
    g.fillStyle(0x4ca86b, 1);
    g.fillRect(51, 38, 10, 4);
    g.generateTexture('resource-leaf', 84, 84);

    g.clear();
    g.fillStyle(0xffd99f, 1);
    g.fillTriangle(42, 12, 66, 42, 42, 72);
    g.fillTriangle(42, 12, 18, 42, 42, 72);
    g.fillStyle(0xfff2d0, 1);
    g.fillCircle(42, 42, 9);
    g.generateTexture('resource-star', 84, 84);

    g.clear();
    g.fillStyle(0x8ed7ff, 1);
    g.fillCircle(42, 49, 20);
    g.fillTriangle(42, 8, 24, 45, 60, 45);
    g.fillStyle(0xd7f1ff, 1);
    g.fillCircle(38, 45, 8);
    g.generateTexture('resource-drop', 84, 84);

    g.clear();
    g.fillStyle(0xc6b3ff, 1);
    g.fillCircle(42, 42, 16);
    g.fillStyle(0xe9dfff, 1);
    g.fillCircle(34, 35, 6);
    g.generateTexture('resource-seed', 84, 84);

    g.clear();
    g.fillStyle(0xff7b7b, 1);
    g.fillTriangle(42, 10, 62, 70, 22, 70);
    g.fillStyle(0xffb4b4, 1);
    g.fillTriangle(42, 18, 53, 58, 31, 58);
    g.generateTexture('hazard-spike', 84, 84);

    g.clear();
    g.fillStyle(0xf278a0, 1);
    g.fillCircle(32, 36, 16);
    g.fillCircle(50, 40, 18);
    g.fillCircle(42, 56, 16);
    g.fillStyle(0xffc0d8, 1);
    g.fillCircle(30, 32, 7);
    g.generateTexture('hazard-smoke', 84, 84);

    g.clear();
    g.fillStyle(0xff8c8c, 1);
    g.fillTriangle(42, 10, 54, 34, 30, 34);
    g.fillTriangle(74, 42, 50, 54, 50, 30);
    g.fillTriangle(42, 74, 54, 50, 30, 50);
    g.fillTriangle(10, 42, 34, 54, 34, 30);
    g.fillStyle(0xffccd0, 1);
    g.fillCircle(42, 42, 8);
    g.generateTexture('hazard-shard', 84, 84);

    g.destroy();

    let lastAvailableStage: number | null = null;
    for (let stage = 0; stage <= CHARACTER_STAGE_MAX; stage += 1) {
      const key = `character-stage-${stage}`;
      const missing = !this.textures.exists(key) || this.failedAssets.has(key);

      if (!missing) {
        lastAvailableStage = stage;
        continue;
      }

      if (lastAvailableStage !== null) {
        const prevKey = `character-stage-${lastAvailableStage}`;
        if (this.copyCharacterTexture(prevKey, key)) {
          continue;
        }
      }

      this.createFallbackCharacterTexture(key, stage);
      lastAvailableStage = stage;
    }
  }

  private copyCharacterTexture(fromKey: string, toKey: string): boolean {
    if (!this.textures.exists(fromKey)) {
      return false;
    }

    if (this.textures.exists(toKey)) {
      this.textures.remove(toKey);
    }

    const source = this.textures.get(fromKey).getSourceImage() as HTMLImageElement | undefined;
    if (!source) {
      return false;
    }

    this.textures.addImage(toKey, source);
    return this.textures.exists(toKey);
  }

  private createFallbackCharacterTexture(key: string, stage: number): void {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }

    const g = this.add.graphics();
    const w = 220;
    const h = 220;

    const bodyFrom = { r: 28, g: 34, b: 44 };
    const bodyTo = { r: 247, g: 215, b: 187 };
    const eyeFrom = 0xff544e;
    const eyeTo = 0x7ac0ff;

    const t = stage / CHARACTER_STAGE_MAX;
    const bodyColor = Phaser.Display.Color.GetColor(
      Phaser.Math.Linear(bodyFrom.r, bodyTo.r, t),
      Phaser.Math.Linear(bodyFrom.g, bodyTo.g, t),
      Phaser.Math.Linear(bodyFrom.b, bodyTo.b, t),
    );

    const eyeColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(eyeFrom),
      Phaser.Display.Color.ValueToColor(eyeTo),
      100,
      t * 100,
    ).color;

    const accentColor = Phaser.Display.Color.GetColor(
      Phaser.Math.Linear(255, 112, t),
      Phaser.Math.Linear(72, 140, t),
      Phaser.Math.Linear(72, 204, t),
    );

    if (stage <= 2) {
      g.fillStyle(0x101010, 1);
      g.fillTriangle(70, 74, 86, 26, 104, 74);
      g.fillTriangle(150, 74, 134, 26, 116, 74);
    }

    if (stage <= 1) {
      g.fillStyle(0x1b1b1b, 1);
      g.fillTriangle(50, 116, 15, 126, 50, 146);
      g.fillTriangle(170, 116, 205, 126, 170, 146);
      g.fillStyle(0x862f2f, 1);
      g.fillTriangle(50, 121, 24, 126, 50, 141);
      g.fillTriangle(170, 121, 196, 126, 170, 141);
    }

    g.fillStyle(bodyColor, 1);
    g.fillCircle(110, 145, 52);
    g.fillCircle(110, 83, 50);

    if (stage === 3) {
      g.fillStyle(0xd43d3d, 1);
      g.fillRoundedRect(62, 116, 96, 18, 8);
    }

    if (stage >= 4) {
      g.fillStyle(0x3f2a21, 1);
      g.fillEllipse(110, 46, 84, 30);
      if (stage === 5) {
        g.fillEllipse(70, 78, 34, 72);
        g.fillEllipse(150, 78, 34, 72);
      }
    }

    g.fillStyle(eyeColor, 1);
    g.fillCircle(91, 82, 12);
    g.fillCircle(129, 82, 12);

    g.fillStyle(0x0d0d0d, 1);
    g.fillCircle(91, 83, 5);
    g.fillCircle(129, 83, 5);

    g.fillStyle(accentColor, 0.9);
    g.fillEllipse(110, 106, 30, 10);

    g.generateTexture(key, w, h);
    g.destroy();
  }
}
