export const SceneKeys = {
  BOOT: 'BOOT',
  HUB: 'HUB',
  LEVEL1: 'LEVEL1',
  LEVEL2: 'LEVEL2',
  LEVEL3: 'LEVEL3',
  LEVEL4: 'LEVEL4',
  LEVEL5: 'LEVEL5',
  TRANSFORM: 'TRANSFORM',
  RESULTS: 'RESULTS',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
