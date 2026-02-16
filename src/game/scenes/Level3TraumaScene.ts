import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';
import { SceneKeys } from './SceneKeys';

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
  private cardText!: Phaser.GameObjects.Text;
  private currentCard!: CardDef;

  private cardHome = new Phaser.Math.Vector2(0, 0);

  constructor() {
    super(SceneKeys.LEVEL3, 3, 'Уровень 3: Травма');
  }

  protected createLevel(): void {
    const { width, height } = this.scale;

    this.cards = Phaser.Utils.Array.Shuffle(this.cards.slice());
    this.cardHome.set(width / 2, height * 0.38);

    this.add
      .text(width / 2, height * 0.84, 'Проведи карточку в корзину: Факт / Чувство / Мысль', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '15px',
        color: '#dce8ff',
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
    const bucketW = Math.min(160, width * 0.29);
    const bucketH = 92;
    const y = height * 0.7;

    const defs: Array<{ type: CardType; label: string; x: number; color: number }> = [
      { type: 'fact', label: 'Факт', x: width * 0.18, color: 0x4f7cff },
      { type: 'feeling', label: 'Чувство', x: width * 0.5, color: 0x6ec4ff },
      { type: 'thought', label: 'Мысль', x: width * 0.82, color: 0x9d8bff },
    ];

    this.buckets = defs.map((def) => {
      const rect = this.add
        .rectangle(def.x, y, bucketW, bucketH, 0x1a264f, 0.9)
        .setStrokeStyle(3, def.color, 0.85)
        .setDepth(70);

      this.add
        .text(def.x, y - 6, def.label, {
          fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
          fontSize: '20px',
          color: '#eef3ff',
        })
        .setOrigin(0.5)
        .setDepth(71);

      return { type: def.type, label: def.label, rect };
    });
  }

  private createCard(): void {
    this.cardBox = this.add
      .rectangle(this.cardHome.x, this.cardHome.y, Math.min(this.scale.width * 0.78, 500), 160, 0xf5f8ff, 0.95)
      .setStrokeStyle(3, 0x9db7ff, 1)
      .setDepth(85)
      .setInteractive({ draggable: true, useHandCursor: true });

    this.cardText = this.add
      .text(this.cardHome.x, this.cardHome.y, '', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '24px',
        color: '#1b2545',
        align: 'center',
        wordWrap: { width: this.cardBox.width - 28, useAdvancedWrap: true },
      })
      .setOrigin(0.5)
      .setDepth(86);

    this.input.setDraggable(this.cardBox);

    this.cardBox.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.cardBox.setPosition(dragX, dragY);
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
      } else {
        this.addScore(2);
        this.triggerImpact('light');
        this.particleBurst(bucket.rect.x, bucket.rect.y, 0xffc4cf);
      }

      this.tweens.add({
        targets: [this.cardBox, this.cardText],
        x: bucket.rect.x,
        y: bucket.rect.y - 8,
        alpha: 0,
        duration: 180,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.cardBox.setAlpha(1);
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
      targets: [this.cardBox, this.cardText],
      x: this.cardHome.x,
      y: this.cardHome.y,
      duration: 160,
      ease: 'Sine.easeOut',
    });
  }
}
