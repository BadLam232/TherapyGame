import Phaser from 'phaser';
import { completeLevel } from '../modules/progress';
import { hapticImpact, hapticNotify } from '../modules/telegram';
import { safeTop } from '../modules/ui';
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
  private parallax: ParallaxLayer[] = [];

  protected constructor(key: string, levelId: number, levelTitle: string) {
    super(key);
    this.levelId = levelId;
    this.levelTitle = levelTitle;
  }

  protected abstract createLevel(): void;
  protected abstract updateLevel(time: number, delta: number): void;

  create(): void {
    this.ended = false;
    this.score = 0;
    this.timeLeft = 60;

    this.createParallax();
    this.tryAttachVideoOverlay();
    this.createHud();
    this.createLevel();
  }

  update(time: number, delta: number): void {
    if (this.ended) {
      return;
    }

    const dt = delta / 1000;
    this.timeLeft = Math.max(0, this.timeLeft - dt);
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

  protected createCharacterVisual(x: number, y: number, depth = 60): CharacterVisual {
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

    const sprite = this.add.image(x, y, 'player').setDisplaySize(72, 72).setDepth(depth);
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

  private createParallax(): void {
    const { width, height } = this.scale;
    const entries: Array<{ key: string; speed: number; alpha: number; tint: number }> = [
      { key: `level${this.levelId}-back`, speed: 8, alpha: 0.95, tint: 0xffffff },
      { key: `level${this.levelId}-mid`, speed: 15, alpha: 0.95, tint: 0xdbe6ff },
      { key: `level${this.levelId}-front`, speed: 28, alpha: 0.95, tint: 0xc3d6ff },
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

    const vignette = this.add
      .rectangle(width / 2, height / 2, width, height, 0x070b18, 0.28)
      .setDepth(20)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    const glow = this.add
      .image(width / 2, height * 0.28, 'glow')
      .setDisplaySize(width * 1.3, width * 1.3)
      .setAlpha(0.1)
      .setTint(0x9ec4ff)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(21);

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.07, to: 0.15 },
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
    const { width } = this.scale;
    const top = safeTop();

    this.add
      .text(width / 2, top, this.levelTitle, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#f2f4ff',
        stroke: '#0a1026',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(40);

    this.hudScore = this.add
      .text(16, top + 34, 'Очки: 0', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#d6e3ff',
      })
      .setDepth(40);

    this.hudStress = this.add
      .text(16, top + 58, 'Стресс: 0', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#ffc5c8',
      })
      .setDepth(40)
      .setVisible(false);

    this.hudTimer = this.add
      .text(width - 16, top + 34, 'Время: 60с', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#f8dcaf',
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
}
