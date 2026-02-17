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

    this.add.rectangle(width / 2, height / 2, width, height, 0x6f8fb1, 0.9);
    this.add.image(width / 2, height * 0.2, 'glow').setDisplaySize(width * 1.12, width * 1.12).setAlpha(0.24).setTint(0xe6f2ff);

    const panelTop = safeTop() + 58;
    const panelH = Math.min(height * (compact ? 0.44 : 0.5), compact ? 360 : 440);
    const panelBottom = panelTop + panelH;

    createGlassPanel(this, width / 2, panelTop + panelH / 2, Math.min(width * 0.9, 760), panelH, {
      fillColor: 0x3f6088,
      fillAlpha: 0.64,
      strokeColor: 0xf6f9ff,
      strokeAlpha: 0.88,
      glowColor: 0xcde0ff,
      glowAlpha: 0.2,
      depth: 4,
    });

    this.add
      .text(width / 2, safeTop() + 10, 'Итог: Внутренний путь', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '30px' : '36px',
        color: '#ffffff',
        stroke: '#2d4565',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0);

    const portraitSize = compact ? 80 : 96;
    const portraitY = panelTop + 56;
    this.add.image(width / 2, portraitY, getCharacterTextureKey(stage)).setDisplaySize(portraitSize, portraitSize);

    this.add
      .text(width / 2, portraitY + portraitSize / 2 + 14, HUB_INTRO, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '14px' : '16px',
        color: '#f7fbff',
        stroke: '#2d4565',
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
        color: '#ffffff',
        stroke: '#2d4565',
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
        color: '#f3f9ff',
        stroke: '#2d4565',
        strokeThickness: 2,
        align: 'center',
        wordWrap: { width: Math.min(width * 0.84, 620), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(width / 2, panelBottom - (compact ? 28 : 34), DISCLAIMER, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '13px' : '14px',
        color: '#ffe7c8',
        stroke: '#5b4632',
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
