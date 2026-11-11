'use client';

import Sprite from '@/components/pixel/Sprite';
import { CAMPFIRE_OUT, fireForStreak } from '@/components/pixel/sprites';

// The streak fire grows in three stages: kindling (1-2 days), campfire (3-6), bonfire (7+)
export default function StreakFlame({ count }: { count: number }) {
  if (count <= 0) {
    return (
      <div className="flex items-center gap-3">
        <span className="w-[52px] flex justify-center shrink-0">
          <Sprite rows={CAMPFIRE_OUT.rows} palette={CAMPFIRE_OUT.palette} size={36} title="Unlit fire" />
        </span>
        <div>
          <p className="font-display text-2xl text-ink-mist">No streak yet</p>
          <p className="text-base text-ink-mist">Clear a quest to light the fire</p>
        </div>
      </div>
    );
  }

  const { art, stage, size, next } = fireForStreak(count);
  return (
    <div className="flex items-center gap-3">
      <span className="w-[52px] flex justify-center items-end shrink-0" style={{ height: 52 }}>
        <Sprite
          rows={art.rows}
          palette={art.palette}
          size={size}
          title={stage}
          className="animate-[flicker_1.2s_steps(2)_infinite]"
        />
      </span>
      <div>
        <p className="font-display text-2xl text-ember">
          {count} day streak · {stage}
        </p>
        <p className="text-base text-ink-mist">
          +{Math.min(count * 5, 100)}% EXP
          {next ? ` · ${next.daysLeft} more ${next.daysLeft === 1 ? 'day' : 'days'} to a ${next.stage}` : ' · the fire is at full blaze'}
        </p>
      </div>
    </div>
  );
}
