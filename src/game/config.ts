import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HubScene } from './scenes/HubScene';
import { Level1SuppressionScene } from './scenes/Level1SuppressionScene';
import { Level2IrritationScene } from './scenes/Level2IrritationScene';
import { Level3TraumaScene } from './scenes/Level3TraumaScene';
import { Level4AcceptanceScene } from './scenes/Level4AcceptanceScene';
import { Level5RecoveryScene } from './scenes/Level5RecoveryScene';
import { TransformScene } from './scenes/TransformScene';
import { ResultsScene } from './scenes/ResultsScene';

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  const element = document.getElementById(parent);
  const width = element?.clientWidth ?? window.innerWidth;
  const height = element?.clientHeight ?? window.innerHeight;

  return {
    type: Phaser.WEBGL,
    parent,
    width,
    height,
    backgroundColor: '#080a14',
    render: {
      antialias: true,
      powerPreference: 'high-performance',
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width,
      height,
    },
    scene: [
      BootScene,
      HubScene,
      Level1SuppressionScene,
      Level2IrritationScene,
      Level3TraumaScene,
      Level4AcceptanceScene,
      Level5RecoveryScene,
      TransformScene,
      ResultsScene,
    ],
  };
}
