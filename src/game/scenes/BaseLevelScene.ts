import Phaser from 'phaser';
import { completeLevel } from '../modules/progress';
import { hapticImpact, hapticNotify } from '../modules/telegram';
import { createGlassPanel, safeTop } from '../modules/ui';
import { getCharacterStage, getCharacterTextureKey } from '../modules/character';
import { SceneKeys } from './SceneKeys';

interface ParallaxLayer {
  sprite: Phaser.GameObjects.TileSprite;
  speed: number;
}

export interface CharacterVisual {
  shadow: Phaser.GameObjects.Ellipse;
  sprite: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
}

export abstract class BaseLevelScene extends Phaser.Scene {
  protected readonly levelId: number;
  protected readonly levelTitle: string;
  protected score = 0;
  protected stress = 0;
  protected showStress = false;

  private hudScore!: Phaser.GameObjects.Text;
  private hudStress!: Phaser.GameObjects.Text;
  private hudTimer!: Phaser.GameObjects.Text;

  private timeLeft = 60;
  private ended = false;
  private timerPaused = false;
  private parallax: ParallaxLayer[] = [];
  private stageIntroPlayed = false;
  private stageIntroFromKey = '';
  private stageIntroToKey = '';
  private stageIntroEnabled = false;
  private stageIntroStage = 0;

  protected constructor(key: string, levelId: number, levelTitle: string) {
    super(key);
    this.levelId = levelId;
    this.levelTitle = levelTitle;
  }

  protected abstract createLevel(): void;
  protected abstract updateLevel(time: number, delta: number): void;
  protected getLevelDurationSeconds(): number {
    return 60;
  }

  create(): void {
    this.ended = false;
    this.score = 0;
    this.timeLeft = this.getLevelDurationSeconds();
    this.timerPaused = false;
    this.stageIntroPlayed = false;
    this.prepareStageIntro();

    this.createParallax();
    this.tryAttachVideoOverlay();
    this.createHud();
    this.showStageIntroOverlay();
    this.createLevel();
  }

  update(time: number, delta: number): void {
    if (this.ended) {
      return;
    }

    const dt = delta / 1000;
    if (!this.timerPaused) {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
    }
    this.hudTimer.setText(`Время: ${Math.ceil(this.timeLeft)}с`);

    for (const layer of this.parallax) {
      layer.sprite.tilePositionX += layer.speed * dt;
    }

    this.updateHud();
    this.updateLevel(time, delta);

    if (this.timeLeft <= 0) {
      this.onTimeExpired();
    }
  }

  protected onTimeExpired(): void {
    this.finishLevel(true);
  }

  protected addScore(value: number): void {
    this.score = Math.max(0, this.score + value);
  }

  protected addStress(value: number): void {
    this.stress = Phaser.Math.Clamp(this.stress + value, 0, 100);
  }

  protected setStress(value: number): void {
    this.stress = Phaser.Math.Clamp(value, 0, 100);
  }

  protected triggerImpact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
    hapticImpact(style);
  }

  protected createCharacterVisual(x: number, y: number, depth = 60, textureKey = getCharacterTextureKey()): CharacterVisual {
    const shadow = this.add
      .ellipse(x, y + 34, 104, 28, 0x000000, 0.32)
      .setDepth(depth - 2)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    const glow = this.add
      .image(x, y, 'glow')
      .setDisplaySize(190, 190)
      .setAlpha(0.16)
      .setTint(0x8dbdff)
      .setDepth(depth - 1)
      .setBlendMode(Phaser.BlendModes.ADD);

    const startTexture = this.stageIntroEnabled && !this.stageIntroPlayed ? this.stageIntroFromKey : textureKey;
    const sprite = this.add.image(x, y, startTexture).setDisplaySize(108, 108).setDepth(depth);
    this.tryPlayStageIntro(sprite, depth, textureKey);
    return { shadow, sprite, glow };
  }

  protected particleBurst(x: number, y: number, tint = 0xb5dcff): void {
    for (let i = 0; i < 9; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(50, 180);
      const px = this.add
        .image(x, y, 'orb')
        .setDisplaySize(8, 8)
        .setTint(tint)
        .setAlpha(0.9)
        .setDepth(85)
        .setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: px,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(350, 700),
        ease: 'Cubic.easeOut',
        onComplete: () => px.destroy(),
      });
    }
  }

  protected finishLevel(success: boolean, failMessage = 'Попробуй снова: путь не закрепился.'): void {
    if (this.ended) {
      return;
    }

    this.ended = true;

    if (!success) {
      hapticNotify('error');
      this.scene.start(SceneKeys.HUB, { toast: failMessage });
      return;
    }

    hapticNotify('success');
    const result = completeLevel(this.levelId, this.score);
    this.scene.start(SceneKeys.TRANSFORM, {
      levelId: this.levelId,
      score: this.score,
      firstClear: result.firstClear,
      transformation: result.transformation,
    });
  }

  protected failLevel(message: string): void {
    this.finishLevel(false, message);
  }

  protected setTimerPaused(paused: boolean): void {
    this.timerPaused = paused;
  }

  private createParallax(): void {
    const { width, height } = this.scale;
    const useHubBackdrop = this.levelId === 4 || this.levelId === 5;
    const entries: Array<{ key: string; speed: number; alpha: number; tint: number }> = useHubBackdrop
      ? [
          { key: 'level1-back', speed: 10, alpha: 0.84, tint: 0xa08bff },
          { key: 'level1-mid', speed: 28, alpha: 0.62, tint: 0x7947c7 },
          { key: 'level1-front', speed: 58, alpha: 0.55, tint: 0x4f2f8f },
        ]
      : [
          { key: `level${this.levelId}-back`, speed: 8, alpha: 0.95, tint: 0xffffff },
          { key: `level${this.levelId}-mid`, speed: 15, alpha: 0.88, tint: 0xe9f3ff },
          { key: `level${this.levelId}-front`, speed: 28, alpha: 0.82, tint: 0xf6fbff },
        ];

    this.parallax = entries.map((entry, index) => {
      const sprite = this.add
        .tileSprite(0, 0, width, height, entry.key)
        .setOrigin(0)
        .setAlpha(entry.alpha)
        .setTint(entry.tint)
        .setScrollFactor(0)
        .setDepth(index * 4);
      return { sprite, speed: entry.speed };
    });

    if (useHubBackdrop) {
      this.add
        .image(width * 0.18, height * 0.1, 'glow')
        .setDisplaySize(width * 0.56, width * 0.56)
        .setTint(0x6d7aff)
        .setAlpha(0.26)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(9);

      this.add
        .image(width * 0.84, height * 0.16, 'glow')
        .setDisplaySize(width * 0.48, width * 0.48)
        .setTint(0xff6bcf)
        .setAlpha(0.24)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(9);

      const grid = this.add.graphics().setDepth(9);
      grid.lineStyle(1, 0xff8ad9, 0.11);
      const step = Math.max(28, Math.floor(width / 16));
      for (let gx = 0; gx <= width; gx += step) {
        grid.lineBetween(gx, 0, gx, height);
      }
      for (let gy = 0; gy <= height; gy += step) {
        grid.lineBetween(0, gy, width, gy);
      }

      this.add
        .rectangle(width / 2, height / 2, width, height, 0x150926, 0.56)
        .setBlendMode(Phaser.BlendModes.MULTIPLY)
        .setDepth(10);
      return;
    }

    const vignette = this.add
      .rectangle(width / 2, height / 2, width, height, 0x1d2a42, 0.22)
      .setDepth(20)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    const glow = this.add
      .image(width / 2, height * 0.28, 'glow')
      .setDisplaySize(width * 1.3, width * 1.3)
      .setAlpha(0.14)
      .setTint(0xc9ddff)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(21);

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.19 },
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    vignette.setScrollFactor(0);
  }

  private async tryAttachVideoOverlay(): Promise<void> {
    const { width, height } = this.scale;
    const url = `/assets/levels/level${this.levelId}/overlay.mp4`;

    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        return;
      }

      const video = this.add.video(width / 2, height / 2).setDepth(22).setAlpha(0.14);
      video.setDisplaySize(width, height);
      const playable = video as unknown as { loadURL: (...args: unknown[]) => void; play: (...args: unknown[]) => void; setLoop?: (loop: boolean) => void };
      playable.loadURL(url, true);
      playable.setLoop?.(true);
      playable.play(true);
    } catch {
      // Video overlays are optional in MVP.
    }
  }

  private createHud(): void {
    const { width, height } = this.scale;
    const compact = height < 760;
    const top = safeTop();
    const hudHeight = compact ? 78 : 88;
    const titleSize = compact ? '18px' : '22px';
    const statSize = compact ? '16px' : '18px';
    createGlassPanel(this, width / 2, top + hudHeight / 2 - 8, Math.min(width * 0.94, 760), hudHeight, {
      fillColor: 0x3f5f86,
      fillAlpha: 0.54,
      strokeColor: 0xf4f9ff,
      strokeAlpha: 0.82,
      glowColor: 0xb9d2ff,
      glowAlpha: 0.18,
      showSheen: false,
      depth: 38,
    });

    this.add
      .text(width / 2, top, this.levelTitle, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: titleSize,
        color: '#ffffff',
        stroke: '#2b4362',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setDepth(40);

    this.hudScore = this.add
      .text(16, top + (compact ? 30 : 38), 'Очки: 0', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: statSize,
        color: '#e8f2ff',
        stroke: '#2a3f60',
        strokeThickness: 2,
      })
      .setDepth(40);

    this.hudStress = this.add
      .text(16, top + (compact ? 51 : 62), 'Стресс: 0', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: statSize,
        color: '#ffd6da',
        stroke: '#5d3440',
        strokeThickness: 2,
      })
      .setDepth(40)
      .setVisible(false);

    this.hudTimer = this.add
      .text(width - 16, top + (compact ? 30 : 38), 'Время: 60с', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: statSize,
        color: '#ffe3b6',
        stroke: '#5c4524',
        strokeThickness: 2,
      })
      .setOrigin(1, 0)
      .setDepth(40);
  }

  private updateHud(): void {
    this.hudScore.setText(`Очки: ${Math.floor(this.score)}`);
    if (this.showStress) {
      this.hudStress.setVisible(true);
      this.hudStress.setText(`Стресс: ${Math.floor(this.stress)}`);
    }
  }

  private prepareStageIntro(): void {
    const stage = getCharacterStage();
    this.stageIntroStage = stage;
    this.stageIntroFromKey = getCharacterTextureKey(Math.max(0, stage - 1));
    this.stageIntroToKey = getCharacterTextureKey(stage);

    // Animate only when player enters the next uncompleted level (e.g. stage=2 -> level 3).
    this.stageIntroEnabled = stage > 0 && stage < 5 && this.levelId === stage + 1 && this.stageIntroFromKey !== this.stageIntroToKey;
  }

  private tryPlayStageIntro(sprite: Phaser.GameObjects.Image, depth: number, finalTexture: string): void {
    if (!this.stageIntroEnabled || this.stageIntroPlayed) {
      sprite.setTexture(finalTexture);
      return;
    }

    this.stageIntroPlayed = true;
    sprite.setTexture(this.stageIntroFromKey);

    this.time.delayedCall(240, () => {
      const overlay = this.add
        .image(sprite.x, sprite.y, this.stageIntroToKey)
        .setDisplaySize(sprite.displayWidth, sprite.displayHeight)
        .setDepth(depth + 0.5)
        .setAlpha(0)
        .setScale(0.9);

      this.tweens.add({
        targets: overlay,
        alpha: 1,
        scale: 1,
        duration: 520,
        ease: 'Sine.easeOut',
        onUpdate: () => {
          overlay.setPosition(sprite.x, sprite.y);
          overlay.setDisplaySize(sprite.displayWidth, sprite.displayHeight);
        },
      });

      this.tweens.add({
        targets: sprite,
        alpha: 0.25,
        duration: 520,
        ease: 'Sine.easeOut',
        onComplete: () => {
          sprite.setTexture(finalTexture);
          sprite.setAlpha(1);
          overlay.destroy();
          this.triggerImpact('light');
        },
      });
    });
  }

  private showStageIntroOverlay(): void {
    if (!this.stageIntroEnabled) {
      return;
    }

    const { width } = this.scale;
    const y = safeTop() + 84;
    const panel = createGlassPanel(this, width / 2, y, Math.min(width * 0.64, 360), 40, {
      fillColor: 0x4a688f,
      fillAlpha: 0.64,
      strokeColor: 0xf3f8ff,
      strokeAlpha: 0.88,
      glowColor: 0xc0d6ff,
      glowAlpha: 0.2,
      depth: 93,
    });

    const label = this.add
      .text(width / 2, y, `Новая форма: стадия ${this.stageIntroStage}/5`, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#2a4364',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(94);

    panel.setAlpha(0);
    label.setAlpha(0);

    this.tweens.add({
      targets: [panel, label],
      alpha: 1,
      duration: 220,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: [panel, label],
      alpha: 0,
      duration: 320,
      delay: 1000,
      ease: 'Sine.easeIn',
      onComplete: () => {
        panel.destroy();
        label.destroy();
      },
    });
  }
}
