import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';
import { SceneKeys } from './SceneKeys';
import { createButton } from '../modules/ui';

interface FallingResource {
  sprite: Phaser.GameObjects.Image;
  speed: number;
}

export class Level5RecoveryScene extends BaseLevelScene {
  private readonly maxNodes = 5;
  private nodeIndex = 0;

  private collecting = false;
  private collectTimeLeft = 0;
  private collectTimerText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  private playerVisual!: ReturnType<BaseLevelScene['createCharacterVisual']>;
  private resources: FallingResource[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;

  private selectedNodes: string[] = [];
  private choiceButtons: Phaser.GameObjects.Container[] = [];
  private choiceAutoTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super(SceneKeys.LEVEL5, 5, 'Уровень 5: Восстановление');
  }

  protected createLevel(): void {
    const { width, height } = this.scale;

    this.playerVisual = this.createCharacterVisual(width / 2, height * 0.78, 82);
    this.playerVisual.sprite.setDisplaySize(66, 66);

    this.collectTimerText = this.add
      .text(width / 2, height * 0.18, '', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#ffe3b5',
      })
      .setOrigin(0.5)
      .setDepth(88);

    this.hintText = this.add
      .text(width / 2, height * 0.24, '', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#dce9ff',
        align: 'center',
        wordWrap: { width: Math.min(width * 0.9, 620), useAdvancedWrap: true },
      })
      .setOrigin(0.5)
      .setDepth(88);

    this.add
      .text(width / 2, height * 0.88, 'Выбери 5 узлов пути. В каждом событии собирай ресурсы 10 секунд.', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '15px',
        color: '#d9e6ff',
        align: 'center',
      })
      .setOrigin(0.5)
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
        this.addScore(4);
        this.particleBurst(item.sprite.x, item.sprite.y, 0xb8f8ff);
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
  }

  protected onTimeExpired(): void {
    this.finishLevel(this.nodeIndex >= this.maxNodes);
  }

  private showNodeChoice(): void {
    if (this.nodeIndex >= this.maxNodes) {
      this.finishLevel(true);
      return;
    }

    this.collecting = false;
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

    const y = height * 0.56;
    const gap = Math.min(240, width * 0.31);
    const startX = width / 2 - gap;

    options.forEach((option, i) => {
      const btn = createButton(this, startX + i * gap, y, Math.min(width * 0.26, 210), 62, option, () => {
        this.pickNode(option);
      });
      btn.setDepth(90);
      this.choiceButtons.push(btn);
    });

    this.choiceAutoTimer?.remove();
    this.choiceAutoTimer = this.time.delayedCall(2600, () => {
      this.pickNode(options[0]);
    });
  }

  private pickNode(option: string): void {
    if (this.collecting) {
      return;
    }

    this.choiceAutoTimer?.remove();
    this.selectedNodes.push(option);
    this.addScore(6);
    this.triggerImpact('medium');
    this.clearChoiceButtons();
    this.startCollectEvent(option);
  }

  private startCollectEvent(option: string): void {
    this.collecting = true;
    this.collectTimeLeft = 10;
    this.hintText.setText(`Событие: ${option}. Собирай ресурсы 10 секунд.`);

    this.spawnTimer?.remove();
    this.spawnTimer = this.time.addEvent({
      delay: 320,
      loop: true,
      callback: () => this.spawnResource(),
    });
  }

  private finishCollectEvent(): void {
    this.collecting = false;
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
    const sprite = this.add
      .image(x, -24, 'resource')
      .setDisplaySize(30, 30)
      .setTint(0xb6ebff)
      .setDepth(84)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.resources.push({
      sprite,
      speed: Phaser.Math.Between(170, 280),
    });
  }

  private clearChoiceButtons(): void {
    this.choiceButtons.forEach((btn) => btn.destroy());
    this.choiceButtons = [];
  }
}
