'use client';

import { getProgressPercent } from '@/lib/game';

// JRPG-style gauge with a gold fill
export default function XPBar({ level, xpInLevel, xpToNext }: { level: number; xpInLevel: number; xpToNext: number }) {
  const percent = getProgressPercent(xpInLevel, xpToNext);
  return (
    <div>
      <div className="flex justify-between font-display text-2xl text-ink-mist mb-2">
        <span>EXP to Lv {level + 1}</span>
        <span className="text-ink">{xpInLevel}/{xpToNext}</span>
      </div>
      <div
        className="h-4 p-[2px] bg-frame-shadow border-2 border-frame rounded-[3px]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={xpToNext}
        aria-valuenow={xpInLevel}
        aria-label="Experience toward next level"
      >
        <div className="h-full bg-gold shadow-[inset_0_-3px_0_#B98A1C] transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
