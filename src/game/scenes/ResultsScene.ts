import Phaser from 'phaser';
import { DISCLAIMER, HUB_INTRO } from '../data/levelConfig';
import { getProgress, resetProgress } from '../modules/progress';
import { shareResultText } from '../modules/telegram';
import { createButton, safeTop, showToast } from '../modules/ui';
import { SceneKeys } from './SceneKeys';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.RESULTS);
  }

  create(): void {
    const { width, height } = this.scale;
    const progress = getProgress();

    this.add.rectangle(width / 2, height / 2, width, height, 0x090f24, 1);
    this.add.image(width / 2, height * 0.22, 'glow').setDisplaySize(width * 1.2, width * 1.2).setAlpha(0.16).setTint(0x8ec3ff);

    this.add
      .text(width / 2, safeTop() + 14, 'Итог: Внутренний путь', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '38px',
        color: '#f6f9ff',
        stroke: '#0f1530',
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(width / 2, safeTop() + 82, HUB_INTRO, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '17px',
        color: '#d2defc',
        align: 'center',
        wordWrap: { width: Math.min(width * 0.88, 620), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(
        width / 2,
        safeTop() + 165,
        `Общий счёт: ${progress.totalScore}\nСнято черт тени: ${progress.devilRemoved}/5\nПроявлено человеческих черт: ${progress.humanGained}/5`,
        {
          fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
          fontSize: '24px',
          color: '#eff4ff',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5, 0);

    this.add
      .text(width / 2, safeTop() + 296, DISCLAIMER, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '15px',
        color: '#ffd0ad',
        align: 'center',
        wordWrap: { width: Math.min(width * 0.9, 620), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);

    const shareText = [
      'Внутренний путь — мой результат',
      `Счёт: ${progress.totalScore}`,
      `Тень снята: ${progress.devilRemoved}/5`,
      `Человечность проявлена: ${progress.humanGained}/5`,
      '#TelegramMiniApp #ВнутреннийПуть',
    ].join('\n');

    createButton(this, width / 2, height - 160, Math.min(width * 0.86, 480), 58, 'Поделиться результатом', async () => {
      const status = await shareResultText(shareText);
      if (status === 'copied') {
        showToast(this, 'Текст результата скопирован в буфер обмена.');
        return;
      }
      if (status === 'none') {
        showToast(this, 'Поделиться не удалось. Попробуй снова.');
      }
    });

    createButton(this, width / 2, height - 92, Math.min(width * 0.86, 480), 58, 'Вернуться в хаб', () => {
      this.scene.start(SceneKeys.HUB);
    });

    createButton(this, width / 2, height - 24, Math.min(width * 0.86, 480), 50, 'Начать заново', () => {
      resetProgress();
      this.scene.start(SceneKeys.HUB, { toast: 'Прогресс очищен.' });
    });
  }
}
