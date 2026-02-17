import Phaser from 'phaser';
import { DISCLAIMER, HUB_INTRO, LEVEL_META } from '../data/levelConfig';
import { getProgress, isGameCompleted, isLevelUnlocked, resetProgress } from '../modules/progress';
import { hapticImpact } from '../modules/telegram';
import { createButton, createGlassPanel, safeBottom, safeTop, showToast } from '../modules/ui';
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
    const infoPanelH = compact ? 140 : 170;
    const infoPanelY = safeTop() + infoPanelH / 2 + 28;
    createGlassPanel(this, width / 2, infoPanelY, Math.min(width * 0.92, 760), infoPanelH, {
      fillColor: 0x3f6088,
      fillAlpha: 0.56,
      strokeColor: 0xf5f9ff,
      strokeAlpha: 0.86,
      glowColor: 0xbfd4ff,
      glowAlpha: 0.18,
      depth: 18,
    });

    this.add
      .text(width / 2, safeTop() + 2, 'Внутренний путь', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: titleSize,
        color: '#ffffff',
        stroke: '#2d4565',
        strokeThickness: 4,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(20);

    this.add
      .text(width / 2, safeTop() + (compact ? 44 : 56), HUB_INTRO, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '14px' : '16px',
        color: '#f8fcff',
        stroke: '#2e4564',
        strokeThickness: 2,
        align: 'center',
        wordWrap: { width: Math.min(620, width * 0.86), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(20);

    this.add
      .text(width / 2, safeTop() + (compact ? 92 : 112), DISCLAIMER, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '13px' : '14px',
        color: '#ffe7c7',
        stroke: '#5b4632',
        strokeThickness: 2,
        align: 'center',
        wordWrap: { width: Math.min(640, width * 0.88), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(20);

    const portraitSize = compact ? 58 : 68;
    const portraitY = infoPanelY + infoPanelH / 2 + portraitSize / 2 - 10;
    const stage = getCharacterStage(progress);

    this.add
      .text(width / 2, portraitY - portraitSize / 2 - 18, `Стадия: ${stage}/5`, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '13px' : '14px',
        color: '#f8fcff',
        stroke: '#2e4564',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0)
      .setDepth(20);

    this.add
      .image(width / 2, portraitY, getCharacterTextureKey(stage))
      .setDisplaySize(portraitSize, portraitSize)
      .setDepth(21);

    const bottomButtonsCount = completed ? 2 : 1;
    const bottomButtonH = compact ? 46 : 50;
    const bottomButtonsSpan = bottomButtonsCount * bottomButtonH + (bottomButtonsCount - 1) * 10;
    const reservedBottom = safeBottom() + bottomButtonsSpan + 24;
    const listStartMin = portraitY + portraitSize / 2 + 20;
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
      showToast(this, data.toast);
    }
  }

  private drawBackground(width: number, height: number): void {
    const back = this.add.tileSprite(0, 0, width, height, 'level1-back').setOrigin(0).setAlpha(0.95);
    const mid = this.add.tileSprite(0, 0, width, height, 'level1-mid').setOrigin(0).setAlpha(0.84).setTint(0xeef6ff);
    const front = this.add.tileSprite(0, 0, width, height, 'level1-front').setOrigin(0).setAlpha(0.78).setTint(0xf9fdff);

    this.tweens.add({ targets: back, tilePositionX: 220, duration: 22000, repeat: -1, ease: 'Linear' });
    this.tweens.add({ targets: mid, tilePositionX: 450, duration: 16000, repeat: -1, ease: 'Linear' });
    this.tweens.add({ targets: front, tilePositionX: 700, duration: 12000, repeat: -1, ease: 'Linear' });

    this.add
      .rectangle(width / 2, height / 2, width, height, 0x203147, 0.34)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(10);
  }
}
