'use client';

import Sprite from '@/components/pixel/Sprite';
import { ITEMS, ItemCategory } from '@/components/pixel/sprites';

interface QuestCardProps {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: number;
  xp_reward: number;
  narrative_text: string | null;
  status: string;
  onComplete?: (id: string) => void;
  busy?: boolean;
}

const CATEGORY_LABEL: Record<string, string> = { focus: 'Focus', wellness: 'Wellness', social: 'Social', misc: 'Errand' };

export default function QuestCard({
  id, title, description, category, difficulty, xp_reward, narrative_text, status, onComplete, busy,
}: QuestCardProps) {
  const done = status === 'completed';
  const item = ITEMS[(category in ITEMS ? category : 'misc') as ItemCategory];
  const stars = Math.max(1, Math.min(5, difficulty));

  return (
    <article className={`window flex flex-col gap-3 ${done ? 'saturate-50 brightness-90' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="window-inset p-1.5 shrink-0">
          <Sprite rows={item.rows} palette={item.palette} size={36} title={item.name} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={done ? 'line-through decoration-2 text-ink-mist' : ''}>{title}</h3>
          <p className="text-ink-mist text-base mt-1">
            {CATEGORY_LABEL[category] ?? 'Errand'} quest · reward: {item.name.toLowerCase()}
            <span className="block" aria-label={`difficulty ${stars} of 5`}>{'★'.repeat(stars)}<span className="text-ink-dim">{'★'.repeat(5 - stars)}</span></span>
          </p>
        </div>
        <span className="font-display text-xl text-gold whitespace-nowrap pt-1">+{xp_reward} XP</span>
      </div>

      {description && <p>{description}</p>}
      {narrative_text && <p className="text-ink-mist italic">{narrative_text}</p>}

      <div className="mt-auto pt-1">
        {done ? (
          <p className="font-display text-xl text-jade">Cleared. {item.name} obtained.</p>
        ) : (
          onComplete && (
            <button className="btn btn-primary w-full" onClick={() => onComplete(id)} disabled={busy}>
              {busy ? 'Clearing…' : 'Mark done'}
            </button>
          )
        )}
      </div>
    </article>
  );
}
