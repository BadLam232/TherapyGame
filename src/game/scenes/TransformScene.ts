import { LEVEL_META } from '../data/levelConfig';
import { getProgress, isGameCompleted, TransformationEvent } from '../modules/progress';
import { hapticImpact } from '../modules/telegram';
import { createButton, safeTop } from '../modules/ui';
import { SceneKeys } from './SceneKeys';
import Phaser from 'phaser';

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

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1024, 1);
    this.add.image(width / 2, height * 0.35, 'glow').setDisplaySize(width * 1.2, width * 1.2).setAlpha(0.18).setTint(0x9ad0ff);

    this.add
      .text(width / 2, safeTop() + 24, `Этап завершён: ${levelMeta?.title ?? ''}`, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '34px',
        color: '#f2f6ff',
        stroke: '#101634',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(width / 2, safeTop() + 96, `Очки этапа: ${Math.floor(data.score)}`, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#dce8ff',
      })
      .setOrigin(0.5, 0);

    const removed = data.transformation?.removed ?? 'Черту тени уже снимали ранее на этом этапе.';
    const gained = data.transformation?.gained ?? 'Человеческая черта уже проявлена ранее на этом этапе.';

    this.add
      .text(width / 2, safeTop() + 152, `- Исчезает: ${removed}`, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#ffc7c8',
        align: 'center',
        wordWrap: { width: Math.min(width * 0.9, 620), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(width / 2, safeTop() + 200, `+ Проявляется: ${gained}`, {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#c5ffe2',
        align: 'center',
        wordWrap: { width: Math.min(width * 0.9, 620), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(
        width / 2,
        safeTop() + 270,
        `Всего снято: ${progress.devilRemoved}/5\nВсего проявлено: ${progress.humanGained}/5`,
        {
          fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
          fontSize: '19px',
          color: '#bfd2ff',
          align: 'center',
        },
      )
      .setOrigin(0.5, 0);

    createButton(this, width / 2, height - 98, Math.min(width * 0.86, 480), 60, 'Продолжить путь', () => {
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
}
