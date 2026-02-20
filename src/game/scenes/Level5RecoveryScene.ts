import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';
import { SceneKeys } from './SceneKeys';
import { createButton } from '../modules/ui';

interface FallingResource {
  sprite: Phaser.GameObjects.Image;
  speed: number;
  harmful: boolean;
}

interface ResourceTheme {
  goodTextures: string[];
  badTextures: string[];
  tint: number;
  badTint: number;
  badChance: number;
}

export class Level5RecoveryScene extends BaseLevelScene {
  private readonly maxNodes = 5;
  private nodeIndex = 0;

  private collecting = false;
  private collectTimeLeft = 0;
  private collectTimerText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private choiceTimerText!: Phaser.GameObjects.Text;

  private playerVisual!: ReturnType<BaseLevelScene['createCharacterVisual']>;
  private resources: FallingResource[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;

  private selectedNodes: string[] = [];
  private choiceButtons: Phaser.GameObjects.Container[] = [];
  private choiceAutoTimer?: Phaser.Time.TimerEvent;
  private choiceTickTimer?: Phaser.Time.TimerEvent;
  private choiceSecondsLeft = 0;

  private currentTheme: ResourceTheme = {
    goodTextures: ['resource'],
    badTextures: ['hazard-spike'],
    tint: 0xb6ebff,
    badTint: 0xff8f8f,
    badChance: 0.28,
  };

  constructor() {
    super(SceneKeys.LEVEL5, 5, 'Уровень 5: Восстановление');
  }

  protected createLevel(): void {
    const { width, height } = this.scale;
    const compact = height < 780;
    this.showStress = true;
    this.setStress(18);

    this.playerVisual = this.createCharacterVisual(width / 2, height * (compact ? 0.8 : 0.78), 82);
    this.playerVisual.sprite.setDisplaySize(compact ? 78 : 86, compact ? 78 : 86);

    this.collectTimerText = this.add
      .text(width / 2, height * 0.17, '', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#ffe6ba',
        stroke: '#5f4526',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(88);

    this.hintText = this.add
      .text(width / 2, height * 0.23, '', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '17px' : '18px',
        color: '#ecf5ff',
        stroke: '#2d4565',
        strokeThickness: 2,
        align: 'center',
        wordWrap: { width: Math.min(width * 0.9, 620), useAdvancedWrap: true },
      })
      .setOrigin(0.5)
      .setDepth(88);

    this.choiceTimerText = this.add
      .text(width / 2, height * 0.29, '', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '17px',
        color: '#f9fcff',
        stroke: '#2a4260',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(88);

    this.add
      .text(width / 2, height - 26, 'Собирай полезные ресурсы и избегай красных опасных объектов.', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '14px' : '15px',
        color: '#edf4ff',
        stroke: '#2d4565',
        strokeThickness: 2,
        align: 'center',
        wordWrap: { width: Math.min(width * 0.9, 600), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 1)
      .setDepth(88);

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.collecting || !pointer.isDown) {
        return;
      }
      const x = Phaser.Math.Clamp(pointer.x, 50, this.scale.width - 50);
      this.playerVisual.sprite.x = x;
      this.playerVisual.glow.x = x;
      this.playerVisual.shadow.x = x;
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.spawnTimer?.remove();
      this.choiceAutoTimer?.remove();
      this.choiceTickTimer?.remove();
      this.resources.forEach((item) => item.sprite.destroy());
      this.resources = [];
    });

    this.showNodeChoice();
  }

  protected updateLevel(_time: number, delta: number): void {
    const dt = delta / 1000;

    if (!this.collecting) {
      return;
    }

    this.collectTimeLeft = Math.max(0, this.collectTimeLeft - dt);
    this.collectTimerText.setText(`Сбор ресурсов: ${Math.ceil(this.collectTimeLeft)}с`);

    const playerBounds = this.playerVisual.sprite.getBounds();

    for (let i = this.resources.length - 1; i >= 0; i -= 1) {
      const item = this.resources[i];
      item.sprite.y += item.speed * dt;

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, item.sprite.getBounds())) {
        if (item.harmful) {
          this.addScore(-8);
          this.addStress(14);
          this.triggerImpact('heavy');
          this.particleBurst(item.sprite.x, item.sprite.y, 0xff8b9b);
        } else {
          this.addScore(4);
          this.addStress(-1);
          this.particleBurst(item.sprite.x, item.sprite.y, this.currentTheme.tint);
        }
        item.sprite.destroy();
        this.resources.splice(i, 1);
        continue;
      }

      if (item.sprite.y > this.scale.height + 48) {
        item.sprite.destroy();
        this.resources.splice(i, 1);
      }
    }

    if (this.collectTimeLeft <= 0) {
      this.finishCollectEvent();
    }

    if (this.stress >= 100) {
      this.failLevel('Слишком много урона от опасных объектов.');
    }
  }

  protected onTimeExpired(): void {
    this.finishLevel(this.nodeIndex >= this.maxNodes && this.stress < 100, 'Нужно пройти все 5 узлов и не переполнить стресс.');
  }

  private showNodeChoice(): void {
    if (this.nodeIndex >= this.maxNodes) {
      this.finishLevel(true);
      return;
    }

    this.collecting = false;
    this.setTimerPaused(true);
    this.collectTimerText.setText('');
    this.clearChoiceButtons();

    const { width, height } = this.scale;
    const choiceSets = [
      ['Точка тишины', 'Точка контакта', 'Точка движения'],
      ['Сон', 'Питание', 'Границы'],
      ['Тепло', 'Ритм', 'Поддержка'],
      ['Дневник', 'Прогулка', 'Музыка'],
      ['Вода', 'Дыхание', 'Разговор'],
    ];

    const options = choiceSets[this.nodeIndex] ?? ['Опора', 'Связь', 'Покой'];
    this.hintText.setText(`Узел ${this.nodeIndex + 1}/${this.maxNodes}: выбери направление`);

    this.choiceSecondsLeft = 10;
    this.choiceTimerText.setText(`Время на выбор: ${this.choiceSecondsLeft}с`);

    const buttonW = Math.min(width * 0.78, 420);
    const buttonH = height < 780 ? 56 : 60;
    const gap = 12;
    const choicesTop = height / 3;
    const startY = choicesTop + buttonH / 2;

    options.forEach((option, i) => {
      const btn = createButton(this, width / 2, startY + i * (buttonH + gap), buttonW, buttonH, option, () => {
        this.pickNode(option, i);
      });
      btn.setDepth(90);
      this.choiceButtons.push(btn);
    });

    this.choiceTickTimer?.remove();
    this.choiceTickTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.choiceSecondsLeft = Math.max(0, this.choiceSecondsLeft - 1);
        this.choiceTimerText.setText(`Время на выбор: ${this.choiceSecondsLeft}с`);
      },
    });

    this.choiceAutoTimer?.remove();
    this.choiceAutoTimer = this.time.delayedCall(10000, () => {
      this.pickNode(options[0], 0);
    });
  }

  private pickNode(option: string, optionIndex: number): void {
    if (this.collecting) {
      return;
    }

    this.choiceAutoTimer?.remove();
    this.choiceTickTimer?.remove();
    this.choiceTimerText.setText('');

    this.selectedNodes.push(option);
    this.currentTheme = this.themeByOption(optionIndex);
    this.addScore(6);
    this.triggerImpact('medium');
    this.clearChoiceButtons();
    this.startCollectEvent(option);
  }

  private startCollectEvent(option: string): void {
    this.collecting = true;
    this.setTimerPaused(false);
    this.collectTimeLeft = 10;
    this.hintText.setText(`Событие: ${option}. Собирай ресурсы и избегай опасных объектов 10 секунд.`);

    this.spawnTimer?.remove();
    this.spawnTimer = this.time.addEvent({
      delay: 320,
      loop: true,
      callback: () => this.spawnResource(),
    });
  }

  private finishCollectEvent(): void {
    this.collecting = false;
    this.setTimerPaused(true);
    this.spawnTimer?.remove();
    this.resources.forEach((item) => item.sprite.destroy());
    this.resources = [];

    this.nodeIndex += 1;
    this.showNodeChoice();
  }

  private spawnResource(): void {
    if (!this.collecting) {
      return;
    }

    const x = Phaser.Math.Between(46, this.scale.width - 46);
    const harmful = Math.random() < this.currentTheme.badChance;
    const texture = harmful
      ? Phaser.Utils.Array.GetRandom(this.currentTheme.badTextures)
      : Phaser.Utils.Array.GetRandom(this.currentTheme.goodTextures);
    const tint = harmful ? this.currentTheme.badTint : this.currentTheme.tint;
    const size = harmful ? 34 : 30;

    const sprite = this.add
      .image(x, -24, texture)
      .setDisplaySize(size, size)
      .setTint(tint)
      .setDepth(84)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.resources.push({
      sprite,
      speed: harmful ? Phaser.Math.Between(210, 320) : Phaser.Math.Between(170, 280),
      harmful,
    });
  }

  private themeByOption(index: number): ResourceTheme {
    if (index === 0) {
      return {
        goodTextures: ['resource-leaf', 'resource-drop'],
        badTextures: ['hazard-smoke', 'hazard-spike'],
        tint: 0xbef2ce,
        badTint: 0xff9cb1,
        badChance: 0.24,
      };
    }
    if (index === 1) {
      return {
        goodTextures: ['resource-star', 'resource'],
        badTextures: ['hazard-shard', 'hazard-spike'],
        tint: 0xffe4ad,
        badTint: 0xff8f8f,
        badChance: 0.28,
      };
    }
    return {
      goodTextures: ['resource-seed', 'orb'],
      badTextures: ['hazard-smoke', 'hazard-shard'],
      tint: 0xd7c4ff,
      badTint: 0xffa2d8,
      badChance: 0.31,
    };
  }

  private clearChoiceButtons(): void {
    this.choiceButtons.forEach((btn) => btn.destroy());
    this.choiceButtons = [];
  }
}
