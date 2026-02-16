import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';
import { SceneKeys } from './SceneKeys';
import { createButton } from '../modules/ui';

export class Level4AcceptanceScene extends BaseLevelScene {
  private readonly threshold = 85;
  private prompts = [
    'Я вижу страх перед чужой оценкой.',
    'Я снова пытаюсь быть идеальным.',
    'Мне трудно остановить внутренний спор.',
    'Я устал доказывать, что достоин тепла.',
    'Во мне поднимается волна стыда.',
    'Я хочу всё контролировать, чтобы не болело.',
    'Внутри много уязвимости и мало опоры.',
  ];

  private promptText!: Phaser.GameObjects.Text;
  private stressHint!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.LEVEL4, 4, 'Уровень 4: Самопринятие');
  }

  protected createLevel(): void {
    const { width, height } = this.scale;

    this.showStress = true;
    this.setStress(38);

    const visual = this.createCharacterVisual(width / 2, height * 0.35, 78);
    visual.sprite.setDisplaySize(82, 82);

    this.promptText = this.add
      .text(width / 2, height * 0.5, '', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '28px',
        color: '#edf3ff',
        align: 'center',
        wordWrap: { width: Math.min(620, width * 0.88), useAdvancedWrap: true },
      })
      .setOrigin(0.5)
      .setDepth(80);

    this.stressHint = this.add
      .text(width / 2, height * 0.58, `Удерживай стресс ниже ${this.threshold}`, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#ffcfbf',
      })
      .setOrigin(0.5)
      .setDepth(80);

    createButton(this, width * 0.28, height * 0.7, Math.min(240, width * 0.44), 74, 'Принять', () => {
      this.addStress(-11);
      this.addScore(5);
      this.triggerImpact('medium');
      this.particleBurst(width * 0.28, height * 0.7, 0x9dffd6);
      this.rotatePrompt();
    }).setDepth(82);

    createButton(this, width * 0.72, height * 0.7, Math.min(240, width * 0.44), 74, 'Исправить', () => {
      this.addStress(14);
      this.addScore(12);
      this.triggerImpact('light');
      this.particleBurst(width * 0.72, height * 0.7, 0xffb4c9);
      this.rotatePrompt();
      if (this.stress >= this.threshold) {
        this.failLevel('Стресс вышел за предел. Попробуй чаще выбирать принятие.');
      }
    }).setDepth(82);

    this.add
      .text(width / 2, height * 0.84, 'Принять снижает стресс. Исправить даёт больше очков, но поднимает стресс.', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '15px',
        color: '#dce7ff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(82);

    this.rotatePrompt();
  }

  protected updateLevel(): void {
    this.stressHint.setText(`Удерживай стресс ниже ${this.threshold} (сейчас ${Math.floor(this.stress)})`);
  }

  protected onTimeExpired(): void {
    this.finishLevel(this.stress < this.threshold);
  }

  private rotatePrompt(): void {
    const prompt = Phaser.Utils.Array.GetRandom(this.prompts);
    this.promptText.setText(prompt);
  }
}
