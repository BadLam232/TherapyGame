import Phaser from 'phaser';

export const UI_RADIUS = 15;

function readSafeInset(variable: string, fallback = 0): number {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  const parsed = Number.parseFloat(value.replace('px', ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function safeTop(): number {
  return Math.round(Math.max(12, readSafeInset('--safe-top', 0) + 12));
}

export function safeBottom(): number {
  return Math.round(Math.max(14, readSafeInset('--safe-bottom', 0) + 14));
}

export interface GlassPanelOptions {
  fillColor?: number;
  fillAlpha?: number;
  strokeColor?: number;
  strokeAlpha?: number;
  glowColor?: number;
  glowAlpha?: number;
  depth?: number;
}

export function createGlassPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  options: GlassPanelOptions = {},
): Phaser.GameObjects.Container {
  const fillColor = options.fillColor ?? 0xf4f7ff;
  const fillAlpha = options.fillAlpha ?? 0.1;
  const strokeColor = options.strokeColor ?? 0xefffff;
  const strokeAlpha = options.strokeAlpha ?? 0.58;
  const glowColor = options.glowColor ?? 0x79f1ff;
  const glowAlpha = options.glowAlpha ?? 0.18;

  const glowCyan = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  glowCyan.fillStyle(glowColor, glowAlpha);
  glowCyan.fillRoundedRect(-width / 2 - 6, -height / 2 - 6, width + 12, height + 12, UI_RADIUS + 3);

  const glowPink = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  glowPink.fillStyle(0xff79d8, glowAlpha * 0.56);
  glowPink.fillRoundedRect(-width / 2 - 3, -height / 2 - 3, width + 6, height + 6, UI_RADIUS + 1);

  const bg = scene.add.graphics();
  bg.fillStyle(fillColor, fillAlpha);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, UI_RADIUS);
  bg.lineStyle(1.5, strokeColor, strokeAlpha);
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, UI_RADIUS);
  bg.lineStyle(1, 0xa0a9ff, strokeAlpha * 0.58);
  bg.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, UI_RADIUS - 1);

  const sheen = scene.add.graphics().setBlendMode(Phaser.BlendModes.SCREEN);
  sheen.fillStyle(0xffffff, 0.17);
  sheen.fillRoundedRect(-width * 0.43, -height * 0.39, width * 0.86, height * 0.34, Math.max(4, UI_RADIUS - 6));
  sheen.fillStyle(0x95f8ff, 0.1);
  sheen.fillRoundedRect(-width * 0.2, -height * 0.1, width * 0.62, height * 0.18, Math.max(4, UI_RADIUS - 8));

  const panel = scene.add.container(x, y, [glowCyan, glowPink, bg, sheen]);
  panel.setDepth(options.depth ?? 0);
  return panel;
}

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  onTap: () => void,
  enabled = true,
): Phaser.GameObjects.Container {
  const panel = createGlassPanel(scene, 0, 0, width, height, {
    fillColor: enabled ? 0xeff3ff : 0x83879b,
    fillAlpha: enabled ? 0.14 : 0.22,
    strokeColor: enabled ? 0xf5ffff : 0xd1d7ec,
    strokeAlpha: enabled ? 0.74 : 0.38,
    glowColor: enabled ? 0x7af2ff : 0x8d93ad,
    glowAlpha: enabled ? 0.2 : 0.08,
  });
  const fontSize = `${Math.round(Phaser.Math.Clamp(height * 0.4, 16, 24))}px`;

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
      fontSize,
      color: enabled ? '#eff4ff' : '#ced4e2',
      stroke: enabled ? '#23163f' : '#3f4252',
      strokeThickness: 3,
      align: 'center',
    })
    .setOrigin(0.5);

  const hit = scene.add.rectangle(0, 0, width, height, 0xffffff, 0.001);
  const container = scene.add.container(x, y, [panel, text, hit]);

  if (!enabled) {
    return container;
  }

  hit.setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      panel.setScale(1.01);
      panel.setAlpha(1);
    })
    .on('pointerout', () => {
      panel.setScale(1);
      panel.setAlpha(1);
    })
    .on('pointerdown', () => {
      panel.setScale(0.985);
      text.setAlpha(0.9);
    })
    .on('pointerup', () => {
      panel.setScale(1.01);
      text.setAlpha(1);
      onTap();
    });

  return container;
}

export function showToast(scene: Phaser.Scene, text: string): void {
  const { width, height } = scene.scale;
  const box = createGlassPanel(scene, width / 2, height - safeBottom() - 40, Math.min(width * 0.9, 500), 44, {
    fillColor: 0xf5f7ff,
    fillAlpha: 0.16,
    strokeColor: 0xf3ffff,
    strokeAlpha: 0.8,
    glowColor: 0x7eeeff,
    glowAlpha: 0.22,
    depth: 1000,
  });

  const label = scene.add
    .text(width / 2, height - safeBottom() - 40, text, {
      fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#f5f8ff',
      stroke: '#291d46',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: Math.min(width * 0.84, 470), useAdvancedWrap: true },
    })
    .setOrigin(0.5)
    .setDepth(1001);

  scene.tweens.add({
    targets: [box, label],
    alpha: 0,
    delay: 1300,
    duration: 450,
    onComplete: () => {
      box.destroy();
      label.destroy();
    },
  });
}
