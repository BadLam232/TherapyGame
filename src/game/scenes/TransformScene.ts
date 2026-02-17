import { LEVEL_META } from '../data/levelConfig';
import { getProgress, isGameCompleted, TransformationEvent } from '../modules/progress';
import { hapticImpact } from '../modules/telegram';
import { createButton, createGlassPanel, safeBottom, safeTop } from '../modules/ui';
import { SceneKeys } from './SceneKeys';
import Phaser from 'phaser';
import { getCharacterTextureKey, getTransformStages } from '../modules/character';

interface TransformData {
  levelId: number;
  score: number;
  firstClear: boolean;
  transformation: TransformationEvent | null;
}

export class TransformScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.TRANSFORM);
  }

  create(data: TransformData): void {
    const { width, height } = this.scale;
    const progress = getProgress();
    const levelMeta = LEVEL_META.find((l) => l.id === data.levelId);
    const stages = getTransformStages(progress, data.firstClear);
    const compact = height < 780;
    const portraitY = safeTop() + (compact ? 158 : 184);
    const portraitSize = compact ? 98 : 122;

    this.add.rectangle(width / 2, height / 2, width, height, 0x6f8fb1, 0.85);
    this.add.image(width / 2, height * 0.35, 'glow').setDisplaySize(width * 1.2, width * 1.2).setAlpha(0.22).setTint(0xe0efff);
    const panelH = Math.min(height * (compact ? 0.44 : 0.5), 430);
    createGlassPanel(this, width / 2, safeTop() + 36 + panelH / 2, Math.min(width * 0.9, 720), panelH, {
      fillColor: 0x3f6189,
      fillAlpha: 0.6,
      strokeColor: 0xf5f9ff,
      strokeAlpha: 0.86,
      glowColor: 0xc9dcff,
      glowAlpha: 0.2,
      depth: 4,
    });

    this.add
      .text(width / 2, safeTop() + 20, `Этап завершён: ${levelMeta?.title ?? ''}`, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '24px' : '30px',
        color: '#ffffff',
        stroke: '#2d4565',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(width / 2, safeTop() + (compact ? 66 : 84), `Очки этапа: ${Math.floor(data.score)}`, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '18px' : '22px',
        color: '#f4f9ff',
        stroke: '#2d4565',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0);

    const beforePortrait = this.add
      .image(width / 2, portraitY, getCharacterTextureKey(stages.before))
      .setDisplaySize(portraitSize, portraitSize)
      .setAlpha(data.firstClear ? 1 : 0);

    const afterPortrait = this.add
      .image(width / 2, portraitY, getCharacterTextureKey(stages.after))
      .setDisplaySize(portraitSize, portraitSize)
      .setAlpha(data.firstClear ? 0 : 1)
      .setScale(data.firstClear ? 0.9 : 1);

    if (data.firstClear && stages.before !== stages.after) {
      this.playTransformationTransition(beforePortrait, afterPortrait, portraitY);
    }

    createButton(this, width / 2, height - safeBottom() - 30, Math.min(width * 0.86, 480), compact ? 52 : 58, 'Продолжить путь', () => {
      hapticImpact('medium');
      if (isGameCompleted(progress)) {
        this.scene.start(SceneKeys.RESULTS);
        return;
      }
      this.scene.start(SceneKeys.HUB, {
        toast: data.firstClear ? 'Новый уровень открыт.' : 'Результат обновлён.',
      });
    });
  }

  private playTransformationTransition(beforePortrait: Phaser.GameObjects.Image, afterPortrait: Phaser.GameObjects.Image, y: number): void {
    const flash = this.add
      .image(this.scale.width / 2, y, 'glow')
      .setDisplaySize(afterPortrait.displayWidth * 2.2, afterPortrait.displayHeight * 2.2)
      .setTint(0xf2fbff)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0)
      .setDepth(afterPortrait.depth + 1);

    this.time.delayedCall(260, () => {
      this.tweens.add({
        targets: flash,
        alpha: { from: 0, to: 0.42 },
        duration: 340,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });

      this.tweens.add({
        targets: beforePortrait,
        alpha: 0,
        scale: 0.92,
        duration: 520,
        ease: 'Quad.easeOut',
      });

      this.tweens.add({
        targets: afterPortrait,
        alpha: 1,
        scale: 1,
        duration: 520,
        ease: 'Back.easeOut',
      });

      this.time.delayedCall(300, () => {
        hapticImpact('light');
      });
    });
  }
}
