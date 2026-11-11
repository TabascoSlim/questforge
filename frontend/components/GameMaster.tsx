'use client';

import Sprite from '@/components/pixel/Sprite';
import { OWL } from '@/components/pixel/sprites';

// Hazel the owl speaks in a dialog window
export default function GameMaster({ message, type = 'quest' }: { message: string; type?: 'quest' | 'level-up' | 'warning' | 'recap' }) {
  const nameColor = type === 'level-up' ? 'text-gold' : type === 'warning' ? 'text-ruby' : 'text-ink-mist';
  return (
    <div className="window flex items-start gap-4" role="status">
      <span className="window-inset p-1 shrink-0">
        <Sprite rows={OWL.rows} palette={OWL.palette} size={44} title="Hazel the owl" />
      </span>
      <div>
        <p className={`font-display text-xl ${nameColor} mb-1`}>Hazel</p>
        <p>{message}</p>
      </div>
    </div>
  );
}
