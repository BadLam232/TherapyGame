import Phaser from 'phaser';
import { DISCLAIMER, HUB_INTRO, LEVEL_META } from '../data/levelConfig';
import { getProgress, isGameCompleted, isLevelUnlocked, resetProgress } from '../modules/progress';
import { hapticImpact } from '../modules/telegram';
import { createButton, safeBottom, safeTop, showToast } from '../modules/ui';
import { SceneKeys } from './SceneKeys';

export class HubScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.HUB);
  }

  create(data?: { toast?: string }): void {
    const { width, height } = this.scale;
    const progress = getProgress();

    this.drawBackground(width, height);

    this.add
      .text(width / 2, safeTop(), 'Внутренний путь', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '42px',
        color: '#f7fbff',
        fontStyle: 'bold',
        stroke: '#111934',
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0)
      .setDepth(20);

    this.add
      .text(width / 2, safeTop() + 56, HUB_INTRO, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#d2defc',
        align: 'center',
        wordWrap: { width: Math.min(560, width * 0.88), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(20);

    this.add
      .text(width / 2, safeTop() + 110, DISCLAIMER, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#ffcfb0',
        align: 'center',
        wordWrap: { width: Math.min(600, width * 0.9), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(20);

    this.add
      .text(
        width / 2,
        safeTop() + 142,
        `Трансформация: снято черт тени ${progress.devilRemoved}/5, проявлено человеческих черт ${progress.humanGained}/5`,
        {
          fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
          fontSize: '15px',
          color: '#bfd6ff',
          align: 'center',
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(20);

    const buttonH = Phaser.Math.Clamp(Math.floor(height * 0.072), 44, 56);
    const buttonGap = 8;
    const startY = safeTop() + 188;
    const buttonW = Math.min(width * 0.84, 460);

    LEVEL_META.forEach((level, idx) => {
      const unlocked = isLevelUnlocked(level.id, progress);
      const complete = progress.completedLevels.includes(level.id);
      const label = `${level.id}. ${level.title} ${complete ? '• пройдено' : ''}`;

      createButton(
        this,
        width / 2,
        startY + idx * (buttonH + buttonGap),
        buttonW,
        buttonH,
        label,
        () => {
          hapticImpact('light');
          this.scene.start(level.key);
        },
        unlocked,
      ).setDepth(30);
    });

    const bottomButtonY = height - safeBottom() - 78;
    createButton(this, width / 2, bottomButtonY, buttonW, 50, 'Сбросить прогресс', () => {
      resetProgress();
      this.scene.restart({ toast: 'Прогресс очищен.' });
    }).setDepth(30);

    if (isGameCompleted(progress)) {
      createButton(this, width / 2, height - safeBottom() - 20, buttonW, 50, 'К финальному итогу', () => {
        this.scene.start(SceneKeys.RESULTS);
      }).setDepth(30);
    }

    if (data?.toast) {
      showToast(this, data.toast);
    }
  }

  private drawBackground(width: number, height: number): void {
    const back = this.add.tileSprite(0, 0, width, height, 'level1-back').setOrigin(0).setAlpha(0.95);
    const mid = this.add.tileSprite(0, 0, width, height, 'level1-mid').setOrigin(0).setAlpha(0.88);
    const front = this.add.tileSprite(0, 0, width, height, 'level1-front').setOrigin(0).setAlpha(0.84);

    this.tweens.add({ targets: back, tilePositionX: 220, duration: 22000, repeat: -1, ease: 'Linear' });
    this.tweens.add({ targets: mid, tilePositionX: 450, duration: 16000, repeat: -1, ease: 'Linear' });
    this.tweens.add({ targets: front, tilePositionX: 700, duration: 12000, repeat: -1, ease: 'Linear' });

    this.add
      .rectangle(width / 2, height / 2, width, height, 0x070a15, 0.42)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(10);
  }
}
