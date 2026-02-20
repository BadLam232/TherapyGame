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
    const headerPanelW = Math.min(width * 0.9, 720);
    const headerPanelH = compact ? 142 : 146;
    const headerPanelY = safeTop() + headerPanelH / 2 + 10;
    const titleY = headerPanelY - headerPanelH / 2 + (compact ? 10 : 16);

    this.add.rectangle(width / 2, height / 2, width, height, 0x1c1032, 0.92);
    this.add.image(width * 0.22, height * 0.16, 'glow').setDisplaySize(width * 0.62, width * 0.62).setAlpha(0.2).setTint(0x7a74ff);
    this.add.image(width * 0.82, height * 0.2, 'glow').setDisplaySize(width * 0.5, width * 0.5).setAlpha(0.18).setTint(0xff75d7);
    this.add.image(width / 2, height * 0.58, 'glow').setDisplaySize(width * 1.2, width * 1.2).setAlpha(0.14).setTint(0x82f4ff);

    createGlassPanel(this, width / 2, headerPanelY, headerPanelW, headerPanelH, {
      fillColor: 0xf3f7ff,
      fillAlpha: 0.1,
      strokeColor: 0xf5ffff,
      strokeAlpha: 0.72,
      glowColor: 0x7aeeff,
      glowAlpha: 0.22,
      showSheen: false,
      depth: 4,
    });

    const titleText = compact ? `Этап завершён:\n${levelMeta?.title ?? ''}` : `Этап завершён: ${levelMeta?.title ?? ''}`;
    const title = this.add
      .text(width / 2, titleY, titleText, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '16px' : '30px',
        color: '#f7f4ff',
        stroke: '#240f3f',
        strokeThickness: compact ? 3 : 4,
        align: 'center',
        lineSpacing: compact ? 2 : 4,
        wordWrap: { width: headerPanelW - 24, useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);

    const scoreY = title.y + title.height + (compact ? 5 : 8);
    this.add
      .text(width / 2, scoreY, `Очки этапа: ${Math.floor(data.score)}`, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: compact ? '16px' : '22px',
        color: '#eff8ff',
        stroke: '#271345',
        strokeThickness: compact ? 2 : 3,
        align: 'center',
        wordWrap: { width: headerPanelW - 24, useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);

    const characterCenterY = height * 0.52;
    const maxCharacterW = Math.min(width * 0.74, 560);
    const maxCharacterH = Math.max(210, height - safeTop() - safeBottom() - 250);

    const beforePortrait = this.add
      .image(width / 2, characterCenterY, getCharacterTextureKey(stages.before))
      .setAlpha(data.firstClear ? 1 : 0);
    const beforeScale = this.fitSpriteContain(beforePortrait, maxCharacterW, maxCharacterH);

    const afterPortrait = this.add
      .image(width / 2, characterCenterY, getCharacterTextureKey(stages.after))
      .setAlpha(data.firstClear ? 0 : 1)
      .setScale(data.firstClear ? 0.92 : 1);
    const afterScale = this.fitSpriteContain(afterPortrait, maxCharacterW, maxCharacterH);
    if (data.firstClear) {
      afterPortrait.setScale(afterScale * 0.92);
    }

    if (data.firstClear && stages.before !== stages.after) {
      this.playTransformationTransition(beforePortrait, afterPortrait, characterCenterY, beforeScale, afterScale);
    }

    createButton(this, width / 2, height - safeBottom() - 70, Math.min(width * 0.86, 480), compact ? 52 : 58, 'Продолжить путь', () => {
      hapticImpact('medium');
      if (isGameCompleted(progress)) {
        this.scene.start(SceneKeys.RESULTS);
        return;
      }
      if (data.firstClear) {
        this.scene.start(SceneKeys.HUB);
        return;
      }
      this.scene.start(SceneKeys.HUB, { toast: 'Результат обновлён.' });
    });
  }

  private fitSpriteContain(sprite: Phaser.GameObjects.Image, maxWidth: number, maxHeight: number): number {
    const frame = sprite.frame;
    const sourceW = frame?.realWidth || frame?.width || sprite.width || 1;
    const sourceH = frame?.realHeight || frame?.height || sprite.height || 1;
    const scale = Math.min(maxWidth / sourceW, maxHeight / sourceH);
    sprite.setScale(scale);
    return scale;
  }

  private playTransformationTransition(
    beforePortrait: Phaser.GameObjects.Image,
    afterPortrait: Phaser.GameObjects.Image,
    y: number,
    beforeScale: number,
    afterScale: number,
  ): void {
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
        scale: beforeScale * 0.92,
        duration: 520,
        ease: 'Quad.easeOut',
      });

      this.tweens.add({
        targets: afterPortrait,
        alpha: 1,
        scale: afterScale,
        duration: 520,
        ease: 'Back.easeOut',
      });

      this.time.delayedCall(300, () => {
        hapticImpact('light');
      });
    });
  }
}
