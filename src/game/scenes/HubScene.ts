import Phaser from 'phaser';
import { LEVEL_META } from '../data/levelConfig';
import { getProgress, isGameCompleted, isLevelUnlocked, resetProgress } from '../modules/progress';
import { hapticImpact } from '../modules/telegram';
import { createButton, safeBottom, safeTop, showToast } from '../modules/ui';
import { SceneKeys } from './SceneKeys';
import { getCharacterStage, getCharacterTextureKey } from '../modules/character';

export class HubScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.HUB);
  }

  create(data?: { toast?: string }): void {
    const { width, height } = this.scale;
    const progress = getProgress();
    const completed = isGameCompleted(progress);
    const compact = height < 780;
    const titleSize = compact ? '32px' : '42px';
    const buttonGap = compact ? 7 : 9;
    const buttonW = Math.min(width * 0.86, 460);

    this.drawBackground(width, height);
    const portraitSize = compact ? 220 : 248;

    this.add
      .text(width / 2, safeTop() + 2, 'Внутренний путь', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: titleSize,
        color: '#f7f4ff',
        stroke: '#240f3f',
        strokeThickness: 4,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(20);

    const portraitY = safeTop() + (compact ? 158 : 184);
    const stage = getCharacterStage(progress);

    this.add
      .image(width / 2, portraitY, getCharacterTextureKey(stage))
      .setDisplaySize(portraitSize, portraitSize)
      .setDepth(21);

    const bottomButtonsCount = completed ? 2 : 1;
    const bottomButtonH = compact ? 46 : 50;
    const bottomButtonsSpan = bottomButtonsCount * bottomButtonH + (bottomButtonsCount - 1) * 10;
    const reservedBottom = safeBottom() + bottomButtonsSpan + 24;
    const listStartMin = portraitY + portraitSize / 2 + 18;
    const listArea = Math.max(220, height - reservedBottom - listStartMin);
    const buttonH = Phaser.Math.Clamp(Math.floor((listArea - (LEVEL_META.length - 1) * buttonGap) / LEVEL_META.length), 40, 56);
    const usedListHeight = LEVEL_META.length * buttonH + (LEVEL_META.length - 1) * buttonGap;
    const startY = listStartMin + Math.max(0, (listArea - usedListHeight) / 2);

    LEVEL_META.forEach((level, idx) => {
      const unlocked = isLevelUnlocked(level.id, progress);
      const complete = progress.completedLevels.includes(level.id);
      const label = `${level.id}. ${level.title}${complete ? ' • пройдено' : ''}`;

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

    const resetY = completed
      ? height - safeBottom() - bottomButtonH - 6
      : height - safeBottom() - bottomButtonH / 2;
    createButton(this, width / 2, resetY, buttonW, bottomButtonH, 'Сбросить прогресс', () => {
      resetProgress();
      this.scene.restart({ toast: 'Прогресс очищен.' });
    }).setDepth(30);

    if (completed) {
      createButton(this, width / 2, resetY - bottomButtonH - 10, buttonW, bottomButtonH, 'К финальному итогу', () => {
        this.scene.start(SceneKeys.RESULTS);
      }).setDepth(30);
    }

    if (data?.toast) {
      const listBottom = startY + usedListHeight;
      const resetTop = resetY - bottomButtonH / 2;
      const gapTop = listBottom + 18;
      const gapBottom = resetTop - 18;
      const defaultToastY = height - safeBottom() - 40;
      const toastY = gapBottom > gapTop ? Phaser.Math.Clamp((gapTop + gapBottom) / 2, gapTop, gapBottom) : defaultToastY;
      showToast(this, data.toast, { y: toastY });
    }
  }

  private drawBackground(width: number, height: number): void {
    const back = this.add.tileSprite(0, 0, width, height, 'level1-back').setOrigin(0).setAlpha(0.84).setTint(0xa08bff);
    const mid = this.add.tileSprite(0, 0, width, height, 'level1-mid').setOrigin(0).setAlpha(0.62).setTint(0x7947c7);
    const front = this.add.tileSprite(0, 0, width, height, 'level1-front').setOrigin(0).setAlpha(0.55).setTint(0x4f2f8f);

    this.tweens.add({ targets: back, tilePositionX: 220, duration: 22000, repeat: -1, ease: 'Linear' });
    this.tweens.add({ targets: mid, tilePositionX: 450, duration: 16000, repeat: -1, ease: 'Linear' });
    this.tweens.add({ targets: front, tilePositionX: 700, duration: 12000, repeat: -1, ease: 'Linear' });

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
  }
}
