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
  const fillColor = options.fillColor ?? 0x39567a;
  const fillAlpha = options.fillAlpha ?? 0.35;
  const strokeColor = options.strokeColor ?? 0xeaf3ff;
  const strokeAlpha = options.strokeAlpha ?? 0.74;
  const glowColor = options.glowColor ?? 0x9cc2ff;
  const glowAlpha = options.glowAlpha ?? 0.2;

  const glow = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  glow.fillStyle(glowColor, glowAlpha);
  glow.fillRoundedRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10, UI_RADIUS + 2);

  const bg = scene.add.graphics();
  bg.fillStyle(fillColor, fillAlpha);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, UI_RADIUS);
  bg.lineStyle(1.5, strokeColor, strokeAlpha);
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, UI_RADIUS);

  const sheen = scene.add.graphics().setBlendMode(Phaser.BlendModes.SCREEN);
  sheen.fillStyle(0xffffff, 0.13);
  sheen.fillRoundedRect(-width * 0.43, -height * 0.39, width * 0.86, height * 0.34, Math.max(4, UI_RADIUS - 6));

  const panel = scene.add.container(x, y, [glow, bg, sheen]);
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
    fillColor: enabled ? 0x4f719e : 0x5f6778,
    fillAlpha: enabled ? 0.58 : 0.34,
    strokeColor: enabled ? 0xf4f9ff : 0xc6cfdf,
    strokeAlpha: enabled ? 0.86 : 0.42,
    glowColor: enabled ? 0xb4d3ff : 0x7c879f,
    glowAlpha: enabled ? 0.2 : 0.08,
  });
  const fontSize = `${Math.round(Phaser.Math.Clamp(height * 0.4, 16, 24))}px`;

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
      fontSize,
      color: enabled ? '#ffffff' : '#d6deef',
      stroke: enabled ? '#2d4566' : '#4f5b74',
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
    fillColor: 0x3f5f87,
    fillAlpha: 0.7,
    strokeColor: 0xf8fcff,
    strokeAlpha: 0.88,
    glowColor: 0xa5c7ff,
    glowAlpha: 0.2,
    depth: 1000,
  });

  const label = scene.add
    .text(width / 2, height - safeBottom() - 40, text, {
      fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#2a3f60',
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
