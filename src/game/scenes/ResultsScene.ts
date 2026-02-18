import Phaser from 'phaser';
import { DISCLAIMER, HUB_INTRO } from '../data/levelConfig';
import { getProgress, resetProgress } from '../modules/progress';
import { createShareCard, SHARE_QUOTES } from '../modules/shareCard';
import { shareResultText } from '../modules/telegram';
import { createButton, createGlassPanel, safeBottom, safeTop, showToast } from '../modules/ui';
import { SceneKeys } from './SceneKeys';
import { getCharacterTextureKey } from '../modules/character';

export class ResultsScene extends Phaser.Scene {
  private quote = SHARE_QUOTES[0];

  constructor() {
    super(SceneKeys.RESULTS);
  }

  create(): void {
    const { width, height } = this.scale;
    const progress = getProgress();
    const stage = Math.min(progress.completedLevels.length, 5);
    const compact = height < 780;

    this.quote = Phaser.Utils.Array.GetRandom(SHARE_QUOTES);

    this.add.rectangle(width / 2, height / 2, width, height, 0x1d0f34, 0.9);
    this.add.image(width / 2, height * 0.2, 'glow').setDisplaySize(width * 1.12, width * 1.12).setAlpha(0.22).setTint(0x8a7eff);
    this.add.image(width * 0.82, height * 0.2, 'glow').setDisplaySize(width * 0.58, width * 0.58).setAlpha(0.18).setTint(0xff73d5);

    const panelTop = safeTop() + 58;
    const panelH = Math.min(height * (compact ? 0.44 : 0.5), compact ? 360 : 440);
    const panelBottom = panelTop + panelH;

    createGlassPanel(this, width / 2, panelTop + panelH / 2, Math.min(width * 0.9, 760), panelH, {
      fillColor: 0xf3f7ff,
      fillAlpha: 0.1,
      strokeColor: 0xf4ffff,
      strokeAlpha: 0.72,
      glowColor: 0x77edff,
      glowAlpha: 0.2,
      depth: 4,
    });

    this.add
      .text(width / 2, safeTop() + 10, 'Итог: Внутренний путь', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '30px' : '36px',
        color: '#f6f3ff',
        stroke: '#220f3b',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0);

    const portraitSize = compact ? 21 : 25;
    const portraitY = panelTop + panelH * 0.23;
    this.add.image(width / 2, portraitY, getCharacterTextureKey(stage)).setDisplaySize(portraitSize, portraitSize);

    this.add
      .text(width / 2, portraitY + portraitSize / 2 + 14, HUB_INTRO, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '14px' : '16px',
        color: '#f6fbff',
        stroke: '#291546',
        strokeThickness: 2,
        align: 'center',
        wordWrap: { width: Math.min(width * 0.86, 620), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);

    const statsText = `Общий счёт: ${progress.totalScore}\nСнято черт тени: ${progress.devilRemoved}/5\nПроявлено человеческих черт: ${progress.humanGained}/5`;

    this.add
      .text(width / 2, panelTop + (compact ? 194 : 222), statsText, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '24px' : '26px',
        color: '#f8f6ff',
        stroke: '#220f3b',
        strokeThickness: 3,
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(width / 2, panelBottom - (compact ? 74 : 82), `«${this.quote}»`, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontStyle: 'italic',
        fontSize: compact ? '15px' : '17px',
        color: '#eff8ff',
        stroke: '#281544',
        strokeThickness: 2,
        align: 'center',
        wordWrap: { width: Math.min(width * 0.84, 620), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(width / 2, panelBottom - (compact ? 28 : 34), DISCLAIMER, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '13px' : '14px',
        color: '#ffd8f3',
        stroke: '#3e1b42',
        strokeThickness: 2,
        align: 'center',
        wordWrap: { width: Math.min(width * 0.88, 620), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);

    const buttonW = Math.min(width * 0.86, 480);
    const buttonH = compact ? 50 : 56;
    const buttonGap = 10;
    const totalButtonsH = buttonH * 3 + buttonGap * 2;
    const firstButtonY = Math.max(panelBottom + 24 + buttonH / 2, height - safeBottom() - totalButtonsH + buttonH / 2);

    createButton(this, width / 2, firstButtonY, buttonW, buttonH, 'Поделиться результатом', async () => {
      await this.shareResultCard();
    });

    createButton(this, width / 2, firstButtonY + buttonH + buttonGap, buttonW, buttonH, 'Вернуться в хаб', () => {
      this.scene.start(SceneKeys.HUB);
    });

    createButton(this, width / 2, firstButtonY + (buttonH + buttonGap) * 2, buttonW, buttonH, 'Начать заново', () => {
      resetProgress();
      this.scene.start(SceneKeys.HUB, { toast: 'Прогресс очищен.' });
    });
  }

  private async shareResultCard(): Promise<void> {
    const progress = getProgress();
    const card = await createShareCard({
      score: progress.totalScore,
      devilRemoved: progress.devilRemoved,
      humanGained: progress.humanGained,
      quote: this.quote,
    });

    const file = card.blob
      ? new File([card.blob], 'vnutrenniy-put-result.png', {
          type: 'image/png',
        })
      : null;

    if (file && navigator.share) {
      try {
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Внутренний путь — мой результат',
            text: card.shareText,
            files: [file],
          });
          return;
        }
      } catch {
        // Continue with fallback flow.
      }
    }

    const status = await shareResultText(card.shareText);
    if (card.blob) {
      this.downloadBlob(card.blob, 'vnutrenniy-put-result.png');
    }

    if (status === 'shared') {
      showToast(this, card.blob ? 'Текст отправлен, карточка сохранена в загрузки.' : 'Результат отправлен.');
      return;
    }

    if (status === 'copied') {
      showToast(this, card.blob ? 'Текст скопирован, карточка сохранена в загрузки.' : 'Текст результата скопирован.');
      return;
    }

    if (card.blob) {
      showToast(this, 'Карточка результата сохранена.');
      return;
    }

    showToast(this, 'Поделиться не удалось. Попробуй снова.');
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
