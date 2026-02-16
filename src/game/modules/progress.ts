import { DEVIL_FEATURES, HUMAN_FEATURES } from '../data/levelConfig';

const STORAGE_KEY = 'internal_path_progress_v1';

export interface TransformationEvent {
  level: number;
  removed: string | null;
  gained: string | null;
}

export interface ProgressState {
  completedLevels: number[];
  levelScores: Record<string, number>;
  totalScore: number;
  devilRemoved: number;
  humanGained: number;
  transforms: TransformationEvent[];
}

interface LevelCompleteResult {
  progress: ProgressState;
  firstClear: boolean;
  transformation: TransformationEvent | null;
}

const defaultProgress = (): ProgressState => ({
  completedLevels: [],
  levelScores: {},
  totalScore: 0,
  devilRemoved: 0,
  humanGained: 0,
  transforms: [],
});

export function getProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultProgress();
    }

    const parsed = JSON.parse(raw) as ProgressState;
    return {
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [],
      levelScores: parsed.levelScores ?? {},
      totalScore: Number.isFinite(parsed.totalScore) ? parsed.totalScore : 0,
      devilRemoved: Number.isFinite(parsed.devilRemoved) ? parsed.devilRemoved : 0,
      humanGained: Number.isFinite(parsed.humanGained) ? parsed.humanGained : 0,
      transforms: Array.isArray(parsed.transforms) ? parsed.transforms : [],
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isLevelUnlocked(level: number, progress = getProgress()): boolean {
  if (level <= 1) {
    return true;
  }
  return progress.completedLevels.includes(level - 1);
}

export function isGameCompleted(progress = getProgress()): boolean {
  return [1, 2, 3, 4, 5].every((id) => progress.completedLevels.includes(id));
}

export function completeLevel(level: number, score: number): LevelCompleteResult {
  const progress = getProgress();
  const key = String(level);
  const prev = progress.levelScores[key] ?? 0;
  const nextBest = Math.max(prev, Math.floor(score));
  progress.levelScores[key] = nextBest;

  const newTotal = Object.values(progress.levelScores).reduce((acc, s) => acc + s, 0);
  progress.totalScore = newTotal;

  const firstClear = !progress.completedLevels.includes(level);
  let transformation: TransformationEvent | null = null;

  if (firstClear) {
    progress.completedLevels.push(level);
    progress.completedLevels.sort((a, b) => a - b);

    const removed = DEVIL_FEATURES[progress.devilRemoved] ?? null;
    const gained = HUMAN_FEATURES[progress.humanGained] ?? null;

    progress.devilRemoved = Math.min(progress.devilRemoved + 1, DEVIL_FEATURES.length);
    progress.humanGained = Math.min(progress.humanGained + 1, HUMAN_FEATURES.length);

    transformation = { level, removed, gained };
    progress.transforms.push(transformation);
  }

  saveProgress(progress);
  return { progress, firstClear, transformation };
}
