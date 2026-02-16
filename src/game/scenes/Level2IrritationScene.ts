import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';
import { SceneKeys } from './SceneKeys';

interface Irritant {
  sprite: Phaser.GameObjects.Image;
  lane: number;
  speed: number;
  neutralized: boolean;
}

export class Level2IrritationScene extends BaseLevelScene {
  private lanes: number[] = [];
  private playerLane = 1;
  private playerVisual!: ReturnType<BaseLevelScene['createCharacterVisual']>;
  private irritants: Irritant[] = [];
  private spawnTimer!: Phaser.Time.TimerEvent;
  private swipeStart = new Phaser.Math.Vector2(0, 0);

  constructor() {
    super(SceneKeys.LEVEL2, 2, 'Уровень 2: Раздражение');
  }

  protected createLevel(): void {
    this.showStress = true;
    this.setStress(30);

    const { width, height } = this.scale;
    this.lanes = [width * 0.25, width * 0.5, width * 0.75];

    this.drawTrack();

    this.playerVisual = this.createCharacterVisual(this.lanes[this.playerLane], height * 0.78, 75);
    this.playerVisual.sprite.setDisplaySize(66, 66);

    this.add
      .text(width / 2, height * 0.88, 'Свайп влево/вправо: сменить полосу. Тап по раздражителю: нейтрализовать.', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '15px',
        color: '#deebff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(81);

    this.spawnTimer = this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => this.spawnIrritant(),
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.swipeStart.set(pointer.x, pointer.y);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.x - this.swipeStart.x;
      const dy = pointer.y - this.swipeStart.y;
      if (Math.abs(dx) < 24 || Math.abs(dx) < Math.abs(dy)) {
        return;
      }

      if (dx < 0) {
        this.changeLane(-1);
      } else {
        this.changeLane(1);
      }
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
          this.addStress(7);
          this.triggerImpact('light');
        }
        ring?.destroy();
        item.sprite.destroy();
        this.irritants.splice(i, 1);
      }
    }

    if (this.stress >= 100) {
      this.failLevel('Стресс переполнен. Попробуй другой ритм движения.');
    }
  }

  protected onTimeExpired(): void {
    const success = this.stress < 100;
    this.finishLevel(success);
  }

  private drawTrack(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height * 0.57, width * 0.76, height * 0.58, 0x111d43, 0.36).setDepth(40);

    for (let i = 0; i < this.lanes.length; i += 1) {
      this.add
        .line(width / 2, height * 0.57, this.lanes[i] - width / 2, -height * 0.3, this.lanes[i] - width / 2, height * 0.3, 0x7ca0ff, 0.4)
        .setLineWidth(2, 2)
        .setDepth(42);
    }
  }

  private changeLane(direction: -1 | 1): void {
    const next = Phaser.Math.Clamp(this.playerLane + direction, 0, this.lanes.length - 1);
    if (next === this.playerLane) {
      return;
    }

    this.playerLane = next;
    const x = this.lanes[this.playerLane];
    this.tweens.add({ targets: this.playerVisual.sprite, x, duration: 120, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this.playerVisual.glow, x, duration: 120, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this.playerVisual.shadow, x, duration: 120, ease: 'Sine.easeOut' });
    this.triggerImpact('light');
  }

  private spawnIrritant(): void {
    const lane = Phaser.Math.Between(0, 2);
    const x = this.lanes[lane];
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
      lane,
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
      this.particleBurst(sprite.x, sprite.y, 0x9fffd4);
      this.triggerImpact('medium');
      ring.destroy();
      sprite.destroy();
      this.irritants = this.irritants.filter((it) => it !== item);
    });

    this.irritants.push(item);
  }

}
