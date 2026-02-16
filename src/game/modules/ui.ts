import Phaser from 'phaser';

export function safeTop(): number {
  return 22;
}

export function safeBottom(): number {
  return 28;
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
  const bg = scene.add
    .rectangle(0, 0, width, height, enabled ? 0x1f2c62 : 0x35384a, enabled ? 0.95 : 0.55)
    .setStrokeStyle(2, enabled ? 0x89a6ff : 0x6f7388, 0.85);

  const glow = scene.add
    .rectangle(0, 0, width + 8, height + 8, enabled ? 0x6085ff : 0x4a4f63, 0.13)
    .setBlendMode(Phaser.BlendModes.ADD);

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
      fontSize: '20px',
      color: enabled ? '#eef2ff' : '#b6b9c8',
      align: 'center',
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [glow, bg, text]);

  if (!enabled) {
    return container;
  }

  bg.setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      bg.setFillStyle(0x2a3a7c, 1);
      glow.setAlpha(0.22);
    })
    .on('pointerout', () => {
      bg.setFillStyle(0x1f2c62, 0.95);
      glow.setAlpha(0.13);
    })
    .on('pointerdown', () => {
      bg.setFillStyle(0x3a4f9f, 1);
    })
    .on('pointerup', () => {
      bg.setFillStyle(0x2a3a7c, 1);
      onTap();
    });

  return container;
}

export function showToast(scene: Phaser.Scene, text: string): void {
  const { width, height } = scene.scale;
  const box = scene.add
    .rectangle(width / 2, height - safeBottom() - 40, Math.min(width * 0.9, 460), 42, 0x10152f, 0.92)
    .setStrokeStyle(1, 0x8ea2ff, 0.85)
    .setDepth(1000);

  const label = scene.add
    .text(box.x, box.y, text, {
      fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#eef1ff',
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
