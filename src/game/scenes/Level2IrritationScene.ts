import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';
import { SceneKeys } from './SceneKeys';

interface Irritant {
  sprite: Phaser.GameObjects.Image;
  speed: number;
  neutralized: boolean;
}

export class Level2IrritationScene extends BaseLevelScene {
  private irritants: Irritant[] = [];
  private spawnTimer!: Phaser.Time.TimerEvent;
  private neutralizedCount = 0;
  private objectiveText!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.LEVEL2, 2, 'Уровень 2: Раздражение');
  }

  protected getLevelDurationSeconds(): number {
    return 40;
  }

  protected createLevel(): void {
    this.showStress = true;
    this.setStress(26);
    this.neutralizedCount = 0;

    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.88, 'Тапай по падающим кругам для нейтрализации. Цель: 12+', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '15px',
        color: '#edf5ff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(81);

    this.objectiveText = this.add
      .text(width / 2, height * 0.83, 'Нейтрализовано: 0 / 12', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#eaf3ff',
      })
      .setOrigin(0.5)
      .setDepth(81);

    this.spawnTimer = this.time.addEvent({
      delay: 760,
      loop: true,
      callback: () => this.spawnIrritant(),
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.spawnTimer?.remove();
      this.irritants.forEach((item) => {
        const ring = item.sprite.getData('ring') as Phaser.GameObjects.Image | undefined;
        ring?.destroy();
        item.sprite.destroy();
      });
      this.irritants = [];
    });
  }

  protected updateLevel(_time: number, delta: number): void {
    const dt = delta / 1000;
    const bottom = this.scale.height + 90;

    for (let i = this.irritants.length - 1; i >= 0; i -= 1) {
      const item = this.irritants[i];
      item.sprite.y += item.speed * dt;
      const ring = item.sprite.getData('ring') as Phaser.GameObjects.Image | undefined;
      ring?.setPosition(item.sprite.x, item.sprite.y);

      if (item.sprite.y > bottom) {
        if (!item.neutralized) {
          this.addStress(10);
          this.triggerImpact('light');
        }
        ring?.destroy();
        item.sprite.destroy();
        this.irritants.splice(i, 1);
      }
    }

    this.objectiveText.setText(`Нейтрализовано: ${this.neutralizedCount} / 12`);
  }

  protected onTimeExpired(): void {
    const success = this.stress < 100 && this.neutralizedCount >= 12;
    this.finishLevel(success, 'Нужно 12+ нейтрализаций и стресс ниже 100.');
  }

  private spawnIrritant(): void {
    if (this.irritants.length >= 7) {
      return;
    }

    const { width } = this.scale;
    const x = Phaser.Math.Between(Math.round(width * 0.18), Math.round(width * 0.82));
    const y = -40;

    const sprite = this.add
      .image(x, y, 'orb')
      .setDisplaySize(44, 44)
      .setTint(0xff8f7a)
      .setAlpha(0.95)
      .setDepth(76)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setInteractive({ useHandCursor: true });

    const ring = this.add
      .image(x, y, 'glow')
      .setDisplaySize(130, 130)
      .setTint(0xff7d65)
      .setAlpha(0.15)
      .setDepth(75)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({ targets: ring, alpha: { from: 0.1, to: 0.23 }, duration: 380, yoyo: true, repeat: -1 });

    const item: Irritant = {
      sprite,
      speed: Phaser.Math.Between(190, 300),
      neutralized: false,
    };
    sprite.setData('ring', ring);

    sprite.on('pointerdown', () => {
      if (item.neutralized) {
        return;
      }
      item.neutralized = true;
      this.addScore(14);
      this.neutralizedCount += 1;
      this.addStress(-2);
      this.particleBurst(sprite.x, sprite.y, 0x9fffd4);
      this.triggerImpact('medium');
      ring.destroy();
      sprite.destroy();
      this.irritants = this.irritants.filter((it) => it !== item);
    });

    this.irritants.push(item);
  }

}
