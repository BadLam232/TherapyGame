import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';
import { SceneKeys } from './SceneKeys';

interface Cell {
  x: number;
  y: number;
  visited: boolean;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
}

type Dir = 'top' | 'right' | 'bottom' | 'left';

export class Level1SuppressionScene extends BaseLevelScene {
  private cols = 8;
  private rows = 11;
  private cellSize = 40;
  private offsetX = 0;
  private offsetY = 0;

  private maze: Cell[][] = [];
  private playerCell = { x: 0, y: 0 };
  private goalCell = { x: 0, y: 0 };

  private mazeBase!: Phaser.GameObjects.Graphics;
  private revealMaskGfx!: Phaser.GameObjects.Graphics;
  private revealMask!: Phaser.Display.Masks.GeometryMask;

  private swipeStart = new Phaser.Math.Vector2(0, 0);
  private holdTimer?: Phaser.Time.TimerEvent;
  private holdExpanded = false;
  private baseLightRadius = 0;
  private expandedLightRadius = 0;
  private currentLightRadius = 0;
  private targetLightRadius = 0;

  private playerVisual!: ReturnType<BaseLevelScene['createCharacterVisual']>;
  private goalOrb!: Phaser.GameObjects.Image;

  constructor() {
    super(SceneKeys.LEVEL1, 1, 'Уровень 1: Подавление');
  }

  protected createLevel(): void {
    const { width, height } = this.scale;
    const boardWidth = Math.min(width * 0.86, 450);
    const boardHeight = Math.min(height * 0.62, 560);

    this.cellSize = Math.floor(Math.min(boardWidth / this.cols, boardHeight / this.rows));
    this.offsetX = Math.floor((width - this.cols * this.cellSize) / 2);
    this.offsetY = Math.floor(height * 0.18);
    this.baseLightRadius = this.cellSize * 1.12;
    this.expandedLightRadius = this.cellSize * 2.05; // long-press reveals ~2 steps ahead
    this.currentLightRadius = this.baseLightRadius;
    this.targetLightRadius = this.baseLightRadius;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.98).setDepth(46);

    this.mazeBase = this.add.graphics().setDepth(48);
    this.revealMaskGfx = this.add.graphics().setDepth(1);
    this.revealMask = this.revealMaskGfx.createGeometryMask();
    this.mazeBase.setMask(this.revealMask);

    this.generateAndDrawMaze();

    const start = this.cellToWorld(this.playerCell.x, this.playerCell.y);
    this.playerVisual = this.createCharacterVisual(start.x, start.y, 72);
    this.playerVisual.sprite.setDisplaySize(70, 70);
    this.playerVisual.shadow.setScale(0.72, 0.72);

    this.add
      .text(width / 2, height * 0.84, 'Свайп: движение. Долгое удержание расширяет свет до 2 шагов.', {
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: '15px',
        color: '#e4ecff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(76);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.swipeStart.set(pointer.x, pointer.y);
      this.holdExpanded = false;
      this.targetLightRadius = this.baseLightRadius;
      this.holdTimer?.remove(false);
      this.holdTimer = this.time.delayedCall(450, () => {
        this.holdExpanded = true;
        this.targetLightRadius = this.expandedLightRadius;
        this.triggerImpact('light');
      });
      this.triggerImpact('light');
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.holdTimer?.remove(false);
      this.holdExpanded = false;
      this.targetLightRadius = this.baseLightRadius;

      const dx = pointer.x - this.swipeStart.x;
      const dy = pointer.y - this.swipeStart.y;
      const threshold = 26;

      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.tryMove(dx > 0 ? 'right' : 'left');
        } else {
          this.tryMove(dy > 0 ? 'bottom' : 'top');
        }
      }
    });

    this.updateLightMask();
  }

  protected updateLevel(_time: number, _delta: number): void {
    this.currentLightRadius = Phaser.Math.Linear(this.currentLightRadius, this.targetLightRadius, 0.22);
    this.updateLightMask();
  }

  private updateLightMask(): void {
    this.revealMaskGfx.clear();
    this.revealMaskGfx.fillStyle(0xffffff, 1);
    this.revealMaskGfx.fillCircle(this.playerVisual.sprite.x, this.playerVisual.sprite.y, this.currentLightRadius);
  }

  private generateAndDrawMaze(): void {
    this.maze = this.generateMaze(this.cols, this.rows);
    this.playerCell = { x: 0, y: 0 };
    this.goalCell = { x: this.cols - 1, y: this.rows - 1 };
    this.drawMaze();
    this.drawGoal();
  }

  private generateMaze(cols: number, rows: number): Cell[][] {
    const grid: Cell[][] = [];
    for (let y = 0; y < rows; y += 1) {
      const row: Cell[] = [];
      for (let x = 0; x < cols; x += 1) {
        row.push({
          x,
          y,
          visited: false,
          walls: { top: true, right: true, bottom: true, left: true },
        });
      }
      grid.push(row);
    }

    const stack: Cell[] = [];
    const start = grid[0][0];
    start.visited = true;
    stack.push(start);

    const dirMap: Record<Dir, { dx: number; dy: number; opposite: Dir }> = {
      top: { dx: 0, dy: -1, opposite: 'bottom' },
      right: { dx: 1, dy: 0, opposite: 'left' },
      bottom: { dx: 0, dy: 1, opposite: 'top' },
      left: { dx: -1, dy: 0, opposite: 'right' },
    };

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const candidates: Array<{ dir: Dir; cell: Cell }> = [];

      (Object.keys(dirMap) as Dir[]).forEach((dir) => {
        const nx = current.x + dirMap[dir].dx;
        const ny = current.y + dirMap[dir].dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
          return;
        }
        const next = grid[ny][nx];
        if (!next.visited) {
          candidates.push({ dir, cell: next });
        }
      });

      if (candidates.length === 0) {
        stack.pop();
        continue;
      }

      const pick = Phaser.Utils.Array.GetRandom(candidates);
      current.walls[pick.dir] = false;
      pick.cell.walls[dirMap[pick.dir].opposite] = false;
      pick.cell.visited = true;
      stack.push(pick.cell);
    }

    return grid;
  }

  private drawMaze(): void {
    this.mazeBase.clear();

    this.mazeBase.fillStyle(0x111111, 0.95);
    this.mazeBase.fillRect(this.offsetX, this.offsetY, this.cols * this.cellSize, this.rows * this.cellSize);

    this.mazeBase.lineStyle(4, 0xffffff, 0.95);

    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.cols; x += 1) {
        const cell = this.maze[y][x];
        const px = this.offsetX + x * this.cellSize;
        const py = this.offsetY + y * this.cellSize;

        if (cell.walls.top) {
          this.mazeBase.strokeLineShape(new Phaser.Geom.Line(px, py, px + this.cellSize, py));
        }
        if (cell.walls.right) {
          this.mazeBase.strokeLineShape(new Phaser.Geom.Line(px + this.cellSize, py, px + this.cellSize, py + this.cellSize));
        }
        if (cell.walls.bottom) {
          this.mazeBase.strokeLineShape(new Phaser.Geom.Line(px, py + this.cellSize, px + this.cellSize, py + this.cellSize));
        }
        if (cell.walls.left) {
          this.mazeBase.strokeLineShape(new Phaser.Geom.Line(px, py, px, py + this.cellSize));
        }
      }
    }
  }

  private drawGoal(): void {
    const g = this.cellToWorld(this.goalCell.x, this.goalCell.y);
    if (this.goalOrb) {
      this.goalOrb.destroy();
    }

    this.goalOrb = this.add
      .image(g.x, g.y, 'resource')
      .setDisplaySize(36, 36)
      .setDepth(74)
      .setTint(0xeef6ff)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setMask(this.revealMask);

    this.tweens.add({
      targets: this.goalOrb,
      alpha: { from: 0.45, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }

  private tryMove(dir: Dir): void {
    const cell = this.maze[this.playerCell.y][this.playerCell.x];
    if (cell.walls[dir]) {
      this.triggerImpact('light');
      return;
    }

    if (dir === 'left') this.playerCell.x -= 1;
    if (dir === 'right') this.playerCell.x += 1;
    if (dir === 'top') this.playerCell.y -= 1;
    if (dir === 'bottom') this.playerCell.y += 1;

    const target = this.cellToWorld(this.playerCell.x, this.playerCell.y);

    this.tweens.add({ targets: this.playerVisual.sprite, x: target.x, y: target.y, duration: 120, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this.playerVisual.glow, x: target.x, y: target.y, duration: 120, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this.playerVisual.shadow, x: target.x, y: target.y + 30, duration: 120, ease: 'Sine.easeOut' });

    this.addScore(2);
    this.triggerImpact('light');

    if (this.playerCell.x === this.goalCell.x && this.playerCell.y === this.goalCell.y) {
      this.setTimerPaused(true);
      this.addScore(40);
      this.particleBurst(target.x, target.y, 0xc7eeff);
      this.triggerImpact('medium');
      this.time.delayedCall(260, () => {
        this.finishLevel(true);
      });
    }
  }

  private cellToWorld(x: number, y: number): { x: number; y: number } {
    return {
      x: this.offsetX + x * this.cellSize + this.cellSize / 2,
      y: this.offsetY + y * this.cellSize + this.cellSize / 2,
    };
  }
}
