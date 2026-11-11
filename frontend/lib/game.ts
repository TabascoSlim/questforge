import { calculate_xp_gain, compute_level, evaluate_streak } from '@/lib/wasm-engine';

export interface LevelInfo {
  level: number;
  xpInLevel: number;
  xpToNext: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
}

export function getXpGain(baseXp: number, streakDays: number, difficulty: number): number {
  return calculate_xp_gain(baseXp, streakDays, difficulty);
}

export function getLevelInfo(totalXp: number): LevelInfo {
  const result = compute_level(totalXp);
  return { level: result[0], xpInLevel: result[1], xpToNext: result[2] };
}

export function getStreakInfo(dates: string[]): StreakInfo {
  const today = new Date().toISOString().split('T')[0];
  const result = evaluate_streak(dates, today);
  return { current: result[0], longest: result[1] };
}

export function getProgressPercent(xpInLevel: number, xpToNext: number): number {
  if (xpToNext <= 0) return 100;
  return Math.round((xpInLevel / xpToNext) * 100);
}
