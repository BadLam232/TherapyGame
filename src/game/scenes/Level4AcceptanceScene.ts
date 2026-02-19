import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';
import { SceneKeys } from './SceneKeys';
import { createButton } from '../modules/ui';

type Choice = 'accept' | 'fix';

export class Level4AcceptanceScene extends BaseLevelScene {
  private readonly stressThreshold = 90;
  private readonly minBalance = 35;
  private readonly maxBalance = 65;

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
  private balanceHint!: Phaser.GameObjects.Text;

  private balance = 50;
  private decisions = 0;
  private lastChoice: Choice | null = null;
  private streak = 0;

  constructor() {
    super(SceneKeys.LEVEL4, 4, 'Уровень 4: Самопринятие');
  }

  protected getLevelDurationSeconds(): number {
    return 40;
  }

  protected createLevel(): void {
    const { width, height } = this.scale;
    const compact = height < 780;

    this.showStress = true;
    this.setStress(42);
    this.balance = 50;
    this.decisions = 0;
    this.lastChoice = null;
    this.streak = 0;

    const visual = this.createCharacterVisual(width / 2, height * (compact ? 0.31 : 0.33), 78);
    visual.sprite.setDisplaySize(compact ? 88 : 98, compact ? 88 : 98);

    this.promptText = this.add
      .text(width / 2, height * (compact ? 0.47 : 0.48), '', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '22px' : '28px',
        color: '#f8fcff',
        stroke: '#2d4565',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: Math.min(620, width * 0.88), useAdvancedWrap: true },
      })
      .setOrigin(0.5)
      .setDepth(80);

    this.stressHint = this.add
      .text(width / 2, height * (compact ? 0.58 : 0.57), '', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '17px',
        color: '#ffe0d6',
        stroke: '#5d3541',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(80);

    this.balanceHint = this.add
      .text(width / 2, height * (compact ? 0.62 : 0.61), '', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '17px',
        color: '#eaf3ff',
        stroke: '#2d4565',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(80);

    const buttonW = Math.min(width * 0.76, 420);
    const buttonH = compact ? 66 : 72;
    const acceptY = height * 0.74;
    const fixY = acceptY + buttonH + (compact ? 14 : 16);

    createButton(this, width / 2, acceptY, buttonW, buttonH, 'Принять', () => {
      this.applyChoice('accept', width / 2, acceptY);
    }).setDepth(82);

    createButton(this, width / 2, fixY, buttonW, buttonH, 'Исправить', () => {
      this.applyChoice('fix', width / 2, fixY);
    }).setDepth(82);

    this.add
      .text(
        width / 2,
        Math.min(height - 56, fixY + buttonH / 2 + 32),
        `Найди динамический баланс: коридор ${this.minBalance}-${this.maxBalance}, минимум 10 решений.\nСлишком однотипные выборы дают штраф.`,
        {
          fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
          fontSize: compact ? '13px' : '14px',
          color: '#edf5ff',
          stroke: '#2d4565',
          strokeThickness: 2,
          align: 'center',
          wordWrap: { width: Math.min(width * 0.9, 620), useAdvancedWrap: true },
        },
      )
      .setOrigin(0.5)
      .setDepth(82);

    this.rotatePrompt();
    this.refreshHints();
  }

  protected updateLevel(): void {
    this.refreshHints();
    if (this.stress >= 100) {
      this.failLevel('Перегруз: стресс достиг предела.');
    }
  }

  protected onTimeExpired(): void {
    const inBalance = this.balance >= this.minBalance && this.balance <= this.maxBalance;
    const enoughDecisions = this.decisions >= 10;
    const stressOk = this.stress < this.stressThreshold;
    const success = inBalance && enoughDecisions && stressOk;

    this.finishLevel(success, 'Нужен баланс, минимум 10 решений и стресс ниже порога.');
  }

  private applyChoice(choice: Choice, x: number, y: number): void {
    this.decisions += 1;

    if (choice === this.lastChoice) {
      this.streak += 1;
    } else {
      this.streak = 1;
      this.lastChoice = choice;
    }

    if (choice === 'accept') {
      this.addStress(-8);
      this.addScore(6);
      this.balance -= 7;
      this.triggerImpact('medium');
      this.particleBurst(x, y, 0xa6ffd8);
    } else {
      this.addStress(9);
      this.addScore(10);
      this.balance += 7;
      this.triggerImpact('light');
      this.particleBurst(x, y, 0xffc1d5);
    }

    // Repeating same strategy becomes less adaptive and is penalized.
    if (this.streak >= 2) {
      if (choice === 'accept') {
        this.addStress(4);
        this.balance -= 5;
      } else {
        this.addStress(6);
        this.balance += 5;
      }
    }

    this.balance = Phaser.Math.Clamp(this.balance, 0, 100);
    this.rotatePrompt();
    this.refreshHints();
  }

  private refreshHints(): void {
    this.stressHint.setText(`Стресс: ${Math.floor(this.stress)} / ${this.stressThreshold}`);
    this.balanceHint.setText(`Баланс: ${Math.floor(this.balance)} (норма ${this.minBalance}-${this.maxBalance}) • решений: ${this.decisions}`);
  }

  private rotatePrompt(): void {
    const prompt = Phaser.Utils.Array.GetRandom(this.prompts);
    this.promptText.setText(prompt);
  }
}
