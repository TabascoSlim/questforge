'use client';

import { useEffect, useState } from 'react';
import { api, LeaderboardEntry } from '@/lib/api';
import Avatar from '@/components/Avatar';

type Scope = 'everyone' | 'guild';

export default function LeaderboardPage() {
  const [scope, setScope] = useState<Scope>('everyone');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [hasGuild, setHasGuild] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe().then((me) => setHasGuild(!!me.team_id)).catch(() => setHasGuild(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getLeaderboard(scope)
      .then((data) => setEntries(data.leaderboard))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [scope]);

  return (
    <div className="space-y-5">
      <header className="window">
        <h1>Leaderboard</h1>
        <p className="mt-1">Total XP earned from finished quests.</p>
        <div role="tablist" aria-label="Leaderboard scope" className="mt-4 flex gap-2">
          {(['everyone', 'guild'] as Scope[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={scope === s}
              disabled={s === 'guild' && !hasGuild}
              onClick={() => setScope(s)}
              className={`btn ${scope === s ? 'btn-primary' : 'btn'}`}
              title={s === 'guild' && !hasGuild ? 'Join a guild to see its leaderboard' : undefined}
            >
              {s === 'everyone' ? 'Everyone' : 'My guild'}
            </button>
          ))}
        </div>
        {!hasGuild && <p className="mt-2 text-sm text-ink-mist">Join a guild to compare with your guildmates.</p>}
      </header>

      {loading ? (
        <p className="font-display text-3xl text-center py-12">Tallying the harvest…</p>
      ) : entries.length === 0 ? (
        <div className="window">
          <p className="font-display text-3xl">
            {scope === 'guild' ? 'Nobody in your guild has earned XP since joining yet.' : 'No XP earned yet.'}
          </p>
          <p>Finish a quest to put your name on the board.</p>
        </div>
      ) : (
        <ol className="window p-0 divide-y-4 divide-ink-dim/40">
          {entries.map((e, i) => (
            <li
              key={e.user_id}
              className={`flex items-center gap-4 px-4 py-3 ${e.is_you ? 'bg-gold/20' : ''}`}
            >
              <span className="font-display text-4xl font-bold w-8 text-right" aria-label={`Rank ${i + 1}`}>
                {i + 1}
              </span>
              <Avatar look={e.avatar} size={44} name={e.username} />
              <span className="flex-1 min-w-0 font-display text-3xl truncate">
                {e.username}
                {e.is_you && <span className="ml-2 text-xl text-gold">(you)</span>}
              </span>
              <span className="font-display text-3xl font-bold">{e.total_xp.toLocaleString()} XP</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
