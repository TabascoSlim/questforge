'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadTodayQuests, rerollQuests, resetTodayQuests, Quest } from '@/lib/quests';
import QuestCard from '@/components/QuestCard';
import GameMaster from '@/components/GameMaster';
import Sprite from '@/components/pixel/Sprite';
import { ITEMS } from '@/components/pixel/sprites';

const LEGEND = [
  { key: 'focus', label: 'Focus' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'social', label: 'Social' },
  { key: 'misc', label: 'Errand' },
] as const;

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rerolling, setRerolling] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    api.getMe().then((me) => setIsDemo(me.is_demo)).catch(() => setIsDemo(false));
  }, []);

  async function handleReset() {
    setRerolling(true);
    try {
      setQuests(await resetTodayQuests());
      setMessage('Fresh chests are on the board. Your EXP and streak are kept.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Today's quests couldn't be reset.");
    } finally {
      setRerolling(false);
    }
  }

  useEffect(() => {
    loadTodayQuests()
      .then(setQuests)
      .catch(() => setMessage("I couldn't fetch today's quests. Check that the server is running."))
      .finally(() => setLoading(false));
  }, []);

  async function handleComplete(questId: string) {
    setBusyId(questId);
    try {
      const result = await api.completeQuest(questId);
      setMessage(`Done. You earned ${result.xp_earned} XP.`);
      setQuests(await loadTodayQuests());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "That quest couldn't be marked done.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReroll() {
    setRerolling(true);
    try {
      setQuests(await rerollQuests());
      setMessage('Fresh quests are on the board. Anything you already finished stays done.');
    } catch {
      setMessage("I couldn't post new quests just now. Try again in a moment.");
    } finally {
      setRerolling(false);
    }
  }

  const open = quests.filter((q) => q.status !== 'completed').length;

  return (
    <div className="space-y-6">
      <header className="window flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1>Today's quests</h1>
          <p className="mt-1">Small, doable tasks for a balanced workday. Each category rewards its own item:</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            {LEGEND.map(({ key, label }) => (
              <li key={key} className="flex items-center gap-1.5 font-display text-2xl">
                <Sprite rows={ITEMS[key].rows} palette={ITEMS[key].palette} size={22} />
                {label}: {ITEMS[key].name.toLowerCase()}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button className="btn" onClick={handleReroll} disabled={rerolling || open === 0}>
            {rerolling ? 'Posting new quests…' : 'Swap unfinished quests'}
          </button>
          {isDemo && (
            <button className="btn btn-gold" onClick={handleReset} disabled={rerolling}>
              Reset today (demo)
            </button>
          )}
        </div>
      </header>

      {message && <GameMaster message={message} />}

      {loading ? (
        <p className="font-display text-3xl text-center py-12">Reading the notice board…</p>
      ) : quests.length === 0 ? (
        <GameMaster message="No quests yet today. Use “Swap unfinished quests” to have a fresh set posted." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quests.map((q) => (
            <QuestCard key={q.id} {...q} onComplete={handleComplete} busy={busyId === q.id} />
          ))}
        </div>
      )}
    </div>
  );
}
