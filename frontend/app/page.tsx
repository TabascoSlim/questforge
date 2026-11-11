'use client';

import { useEffect, useState } from 'react';
import { api, Me } from '@/lib/api';
import { loadTodayQuests, resetTodayQuests, Quest } from '@/lib/quests';
import QuestCard from '@/components/QuestCard';
import XPBar from '@/components/XPBar';
import LevelBadge from '@/components/LevelBadge';
import StreakFlame from '@/components/StreakFlame';
import GameMaster from '@/components/GameMaster';
import TreasureRow from '@/components/TreasureRow';
import DemoButton from '@/components/DemoButton';
import Avatar from '@/components/Avatar';
import Sprite from '@/components/pixel/Sprite';
import { ITEMS } from '@/components/pixel/sprites';

function greetingFor(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name}`;
}

export default function StatusPage() {
  const [token, setToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [stats, setStats] = useState({ level: 1, xp_in_level: 0, xp_to_next: 100, current_streak: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'quest' | 'level-up' | 'warning' } | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    setChecked(true);
    if (t) loadData();
    else setLoading(false);
  }, []);

  async function loadData() {
    try {
      const [profile, todays, s] = await Promise.all([api.getMe(), loadTodayQuests(), api.getStats()]);
      setMe(profile);
      setQuests(todays);
      setStats(s);
    } catch {
      setMessage({ text: "I couldn't reach the server just now. Check that the server is running, then refresh.", type: 'warning' });
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(questId: string) {
    setBusyId(questId);
    try {
      const result = await api.completeQuest(questId);
      if (result.leveled_up) {
        const msg = await api.getLevelUpMessage(result.level);
        setMessage({ text: msg.message, type: 'level-up' });
      } else {
        setMessage({ text: `Nicely done. That earned you ${result.xp_earned} XP.`, type: 'quest' });
      }
      await loadData();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "That quest couldn't be marked done.", type: 'warning' });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReset() {
    setBusyId('reset');
    try {
      setQuests(await resetTodayQuests());
      setMessage({ text: 'Fresh chests are on the board. Your EXP and streak are kept.', type: 'quest' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Today's quests couldn't be reset.", type: 'warning' });
    } finally {
      setBusyId(null);
    }
  }

  if (!checked) return null;

  if (!token) {
    return (
      <section className="max-w-2xl mx-auto text-center">
        <div className="window py-8">
          <div className="flex justify-center gap-4 mb-6" aria-hidden>
            {Object.values(ITEMS).map((c) => (
              <Sprite key={c.name} rows={c.rows} palette={c.palette} size={48} />
            ))}
          </div>
          <h1 className="text-gold">Your workday, played as an RPG</h1>
          <p className="mt-4 max-w-prose mx-auto">
            Each morning Hazel posts a few small quests: a focus sprint, a stretch break, a note to a friend.
            Clear one to open its treasure chest and earn EXP. Keep a streak going and the campfire burns brighter.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/auth/login" className="btn btn-primary">Log in</a>
            <a href="/auth/register" className="btn">Create an account</a>
          </div>
          <DemoButton className="mt-3 max-w-xs mx-auto" />
        </div>
      </section>
    );
  }

  if (loading) {
    return <p className="font-display text-2xl text-center py-20">Loading…</p>;
  }

  const name = me?.display_name || me?.username || 'friend';

  return (
    <div className="space-y-6">
      <TreasureRow quests={quests} greeting={greetingFor(name)} />

      {me?.is_demo && quests.length > 0 && quests.every((q) => q.status === 'completed') && (
        <div className="window flex flex-wrap items-center justify-between gap-3">
          <p>All chests are open. On the demo account you can reset today to try it again.</p>
          <button className="btn btn-gold" onClick={handleReset} disabled={busyId === 'reset'}>
            {busyId === 'reset' ? 'Resetting…' : 'Reset today (demo)'}
          </button>
        </div>
      )}

      {message && <GameMaster message={message.text} type={message.type} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <section aria-labelledby="board-heading" className="lg:col-span-2">
          <h2 id="board-heading" className="mb-3">Quest log</h2>
          {quests.length === 0 ? (
            <GameMaster message="No quests yet this morning. Head to Quests to have a fresh set posted." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {quests.map((q) => (
                <QuestCard key={q.id} {...q} onComplete={handleComplete} busy={busyId === q.id} />
              ))}
            </div>
          )}
        </section>

        <aside aria-label="Your character" className="window space-y-5">
          <div className="flex items-center gap-3">
            <Avatar look={me?.avatar} size={56} name={name} />
            <div className="min-w-0">
              <p className="font-display text-2xl truncate">{name}</p>
              <a href="/profile" className="cursor-item text-ink-mist hover:text-gold">Change your look</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LevelBadge level={stats.level} />
            <div className="flex-1">
              <XPBar level={stats.level} xpInLevel={stats.xp_in_level} xpToNext={stats.xp_to_next} />
            </div>
          </div>
          <StreakFlame count={stats.current_streak} />
        </aside>
      </div>
    </div>
  );
}
