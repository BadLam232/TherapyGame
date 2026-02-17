import { getProgress, ProgressState } from './progress';

export const CHARACTER_STAGE_MAX = 5;

export function getCharacterStage(progress = getProgress()): number {
  const completed = Array.isArray(progress.completedLevels) ? progress.completedLevels.length : 0;
  return Math.min(Math.max(completed, 0), CHARACTER_STAGE_MAX);
}

export function getCharacterTextureKey(stage = getCharacterStage()): string {
  const safeStage = Math.min(Math.max(stage, 0), CHARACTER_STAGE_MAX);
  return `character-stage-${safeStage}`;
}

export function getTransformStages(progress: ProgressState, firstClear: boolean): { before: number; after: number } {
  const after = getCharacterStage(progress);
  if (!firstClear) {
    return { before: after, after };
  }
  return {
    before: Math.max(0, after - 1),
    after,
  };
}
