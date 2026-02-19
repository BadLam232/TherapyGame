import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';
import { SceneKeys } from './SceneKeys';
import { createGlassPanel } from '../modules/ui';

type CardType = 'fact' | 'feeling' | 'thought';

interface CardDef {
  text: string;
  type: CardType;
}

interface BucketDef {
  type: CardType;
  label: string;
  rect: Phaser.GameObjects.Rectangle;
}

export class Level3TraumaScene extends BaseLevelScene {
  private cards: CardDef[] = [
    { text: 'В 9:00 сообщение действительно пришло.', type: 'fact' },
    { text: 'Мне тревожно и тесно в груди.', type: 'feeling' },
    { text: 'Наверное, со мной что-то не так.', type: 'thought' },
    { text: 'В разговоре прозвучали две критические фразы.', type: 'fact' },
    { text: 'Я злюсь и хочу дистанции.', type: 'feeling' },
    { text: 'Если ошибусь, меня отвергнут.', type: 'thought' },
    { text: 'Сердце билось быстрее обычного.', type: 'fact' },
    { text: 'Я ощущаю стыд.', type: 'feeling' },
    { text: 'Надо срочно всё исправить, иначе катастрофа.', type: 'thought' },
  ];

  private buckets: BucketDef[] = [];
  private cardBox!: Phaser.GameObjects.Rectangle;
  private cardPanel!: Phaser.GameObjects.Container;
  private cardText!: Phaser.GameObjects.Text;
  private currentCard!: CardDef;

  private cardHome = new Phaser.Math.Vector2(0, 0);

  constructor() {
    super(SceneKeys.LEVEL3, 3, 'Уровень 3: Травма');
  }

  protected getLevelDurationSeconds(): number {
    return 40;
  }

  protected createLevel(): void {
    const { width, height } = this.scale;
    const compact = height < 780;

    this.cards = Phaser.Utils.Array.Shuffle(this.cards.slice());
    this.cardHome.set(width / 2, compact ? height * 0.43 : height * 0.4);
    this.removeBaseAmbientHalo();
    this.applyHubStyleBackdrop();

    const visual = this.createCharacterVisual(width / 2, compact ? height * 0.2 : height * 0.19, 82);
    visual.glow.destroy();
    visual.sprite.setDisplaySize(compact ? 108 : 122, compact ? 108 : 122);
    visual.shadow.setScale(0.86, 0.8);

    this.add
      .text(width / 2, height * 0.9, 'Проведи карточку в корзину: Факт / Чувство / Мысль', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '14px' : '15px',
        color: '#eff6ff',
        stroke: '#2d4566',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(90);

    this.createBuckets();
    this.createCard();
    this.nextCard();
  }

  protected updateLevel(): void {
    // No per-frame logic required for this level.
  }

  private createBuckets(): void {
    const { width, height } = this.scale;
    const compact = height < 780;
    const bucketW = Math.min(width * 0.82, 430);
    const bucketH = compact ? 64 : 74;
    const startY = height * 0.62;
    const gap = compact ? 10 : 12;

    const defs: Array<{ type: CardType; label: string; y: number; color: number }> = [
      { type: 'fact', label: 'Факт', y: startY, color: 0x4f7cff },
      { type: 'feeling', label: 'Чувство', y: startY + (bucketH + gap), color: 0x6ec4ff },
      { type: 'thought', label: 'Мысль', y: startY + (bucketH + gap) * 2, color: 0x9d8bff },
    ];

    this.buckets = defs.map((def) => {
      createGlassPanel(this, width / 2, def.y, bucketW, bucketH, {
        fillColor: 0x4a678f,
        fillAlpha: 0.58,
        strokeColor: def.color,
        strokeAlpha: 0.9,
        glowColor: 0xc7dcff,
        glowAlpha: 0.18,
        showSheen: false,
        depth: 70,
      });

      const rect = this.add.rectangle(width / 2, def.y, bucketW, bucketH, 0xffffff, 0.001).setDepth(69);

      this.add
        .text(width / 2, def.y, def.label, {
          fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
          fontSize: compact ? '22px' : '24px',
          color: '#f8fcff',
          stroke: '#2e4564',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(71);

      return { type: def.type, label: def.label, rect };
    });
  }

  private removeBaseAmbientHalo(): void {
    this.children.list.forEach((child) => {
      if (child instanceof Phaser.GameObjects.Image && child.depth === 21 && child.texture.key === 'glow') {
        child.destroy();
      }
    });
  }

  private applyHubStyleBackdrop(): void {
    const { width, height } = this.scale;

    this.add
      .rectangle(width / 2, height / 2, width, height, 0x150926, 0.6)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(23);

    this.add
      .image(width * 0.18, height * 0.1, 'glow')
      .setDisplaySize(width * 0.56, width * 0.56)
      .setTint(0x6d7aff)
      .setAlpha(0.22)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(24);

    this.add
      .image(width * 0.84, height * 0.16, 'glow')
      .setDisplaySize(width * 0.48, width * 0.48)
      .setTint(0xff6bcf)
      .setAlpha(0.2)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(24);

    const grid = this.add.graphics().setDepth(24);
    grid.lineStyle(1, 0xff8ad9, 0.1);
    const step = Math.max(28, Math.floor(width / 16));
    for (let gx = 0; gx <= width; gx += step) {
      grid.lineBetween(gx, 0, gx, height);
    }
    for (let gy = 0; gy <= height; gy += step) {
      grid.lineBetween(0, gy, width, gy);
    }
  }

  private createCard(): void {
    const compact = this.scale.height < 780;
    const cardW = Math.min(this.scale.width * 0.72, 420);
    const cardH = compact ? 106 : 126;
    this.cardPanel = createGlassPanel(this, this.cardHome.x, this.cardHome.y, cardW, cardH, {
      fillColor: 0x54749e,
      fillAlpha: 0.72,
      strokeColor: 0xf7fbff,
      strokeAlpha: 0.9,
      glowColor: 0xc5d9ff,
      glowAlpha: 0.18,
      showSheen: false,
      depth: 85,
    });

    this.cardBox = this.add
      .rectangle(this.cardHome.x, this.cardHome.y, cardW, cardH, 0xffffff, 0.001)
      .setDepth(86)
      .setInteractive({ draggable: true, useHandCursor: true });

    this.cardText = this.add
      .text(this.cardHome.x, this.cardHome.y, '', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '18px' : '22px',
        color: '#ffffff',
        stroke: '#2a4160',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: this.cardBox.width - 28, useAdvancedWrap: true },
      })
      .setOrigin(0.5)
      .setDepth(87);

    this.input.setDraggable(this.cardBox);

    this.cardBox.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.cardBox.setPosition(dragX, dragY);
      this.cardPanel.setPosition(dragX, dragY);
      this.cardText.setPosition(dragX, dragY);
    });

    this.cardBox.on('dragend', () => {
      const bucket = this.pickBucket(this.cardBox.x, this.cardBox.y);
      if (!bucket) {
        this.snapCardHome();
        return;
      }

      const isCorrect = bucket.type === this.currentCard.type;
      if (isCorrect) {
        this.addScore(16);
        this.triggerImpact('medium');
        this.particleBurst(bucket.rect.x, bucket.rect.y, 0xb4ffde);
      } else if (bucket.type === 'fact' && (this.currentCard.type === 'feeling' || this.currentCard.type === 'thought')) {
        this.addScore(-10);
        this.triggerImpact('heavy');
        this.particleBurst(bucket.rect.x, bucket.rect.y, 0xff9ba8);
      } else {
        this.addScore(2);
        this.triggerImpact('light');
        this.particleBurst(bucket.rect.x, bucket.rect.y, 0xffc4cf);
      }

      this.tweens.add({
        targets: [this.cardBox, this.cardPanel, this.cardText],
        x: bucket.rect.x,
        y: bucket.rect.y,
        alpha: 0,
        duration: 180,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.cardBox.setAlpha(1);
          this.cardPanel.setAlpha(1);
          this.cardText.setAlpha(1);
          this.nextCard();
          this.snapCardHome();
        },
      });
    });
  }

  private nextCard(): void {
    if (this.cards.length === 0) {
      this.cards = Phaser.Utils.Array.Shuffle(this.cardsTemplate());
    }

    const card = this.cards.shift();
    if (!card) {
      return;
    }

    this.currentCard = card;
    this.cardText.setText(card.text);
  }

  private cardsTemplate(): CardDef[] {
    return [
      { text: 'В 9:00 сообщение действительно пришло.', type: 'fact' },
      { text: 'Мне тревожно и тесно в груди.', type: 'feeling' },
      { text: 'Наверное, со мной что-то не так.', type: 'thought' },
      { text: 'В разговоре прозвучали две критические фразы.', type: 'fact' },
      { text: 'Я злюсь и хочу дистанции.', type: 'feeling' },
      { text: 'Если ошибусь, меня отвергнут.', type: 'thought' },
      { text: 'Сердце билось быстрее обычного.', type: 'fact' },
      { text: 'Я ощущаю стыд.', type: 'feeling' },
      { text: 'Надо срочно всё исправить, иначе катастрофа.', type: 'thought' },
    ];
  }

  private pickBucket(x: number, y: number): BucketDef | null {
    return (
      this.buckets.find((bucket) => {
        const bounds = bucket.rect.getBounds();
        return bounds.contains(x, y);
      }) ?? null
    );
  }

  private snapCardHome(): void {
    this.tweens.add({
      targets: [this.cardBox, this.cardPanel, this.cardText],
      x: this.cardHome.x,
      y: this.cardHome.y,
      duration: 160,
      ease: 'Sine.easeOut',
    });
  }
}
