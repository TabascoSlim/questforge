// WASM game engine — placeholder stubs
// Overwrite this file by running:
//   cd game-wasm && wasm-pack build --target bundler --out-dir ../frontend/lib/wasm-engine
// This will generate wasm-engine.js + wasm-engine_bg.wasm replacing this module.
// Until then, JS fallbacks are used.

export function calculate_xp_gain(base_xp: number, streak_days: number, difficulty_multiplier: number): number {
  const bonus = 1 + Math.min(streak_days * 0.05, 1.0);
  return Math.round(base_xp * bonus * difficulty_multiplier);
}

export function compute_level(total_xp: number): Uint32Array {
  const BASE_XP = 100;
  const SCALE = 1.5;
  let level = 1;
  while (total_xp >= Math.round(BASE_XP * Math.pow(level, SCALE))) {
    level++;
  }
  const cur = level === 1 ? 0 : Math.round(BASE_XP * Math.pow(level - 1, SCALE));
  const next = Math.round(BASE_XP * Math.pow(level, SCALE));
  return new Uint32Array([level, total_xp - cur, next - cur]);
}

export function evaluate_streak(dates: string[], today_iso: string): Uint32Array {
  return new Uint32Array([0, 0]);
}
