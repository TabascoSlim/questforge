'use client';

import { useEffect, useState } from 'react';
import { api, Me } from '@/lib/api';
import Avatar from '@/components/Avatar';
import LevelBadge from '@/components/LevelBadge';
import XPBar from '@/components/XPBar';
import StreakFlame from '@/components/StreakFlame';
import Sprite from '@/components/pixel/Sprite';
import {
  AvatarLook, DEFAULT_LOOK, FACES, HAIR_COLORS, HAIR_STYLES, HATS, ITEMS, OUTFITS, SKINS,
} from '@/components/pixel/sprites';

// Each dropdown in the wardrobe: which avatar field it sets, and its options
const WARDROBE: { key: keyof AvatarLook; label: string; options: [string, string][] }[] = [
  { key: 'skin', label: 'Skin', options: Object.entries(SKINS).map(([k, v]) => [k, v.label]) },
  { key: 'hair', label: 'Hair', options: Object.entries(HAIR_STYLES) },
  { key: 'hair_color', label: 'Hair color', options: Object.entries(HAIR_COLORS).map(([k, v]) => [k, v.label]) },
  { key: 'face', label: 'Face', options: Object.entries(FACES) },
  { key: 'color', label: 'Outfit', options: Object.entries(OUTFITS).map(([k, v]) => [k, v.label]) },
  { key: 'hat', label: 'Hat', options: Object.entries(HATS) },
];

const CATEGORIES = [
  { key: 'focus', label: 'Focus', hint: 'deep-work sprints' },
  { key: 'wellness', label: 'Wellness', hint: 'breaks, stretching, water' },
  { key: 'social', label: 'Social', hint: 'checking in with people' },
  { key: 'misc', label: 'Errands', hint: 'small life admin' },
] as const;

function randomLook(): AvatarLook {
  const pick = (options: [string, string][]) => options[Math.floor(Math.random() * options.length)][0];
  return Object.fromEntries(WARDROBE.map((w) => [w.key, pick(w.options)])) as unknown as AvatarLook;
}

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState('');
  const [look, setLook] = useState<AvatarLook>(DEFAULT_LOOK);
  const [categories, setCategories] = useState<string[]>(['focus', 'wellness', 'social', 'misc']);
  const [stats, setStats] = useState({ level: 1, xp_in_level: 0, xp_to_next: 100, current_streak: 0, total_xp: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    Promise.all([api.getMe(), api.getStats()])
      .then(([profile, s]) => {
        setMe(profile);
        setName(profile.display_name || profile.username);
        setLook({ ...DEFAULT_LOOK, ...profile.avatar });
        const saved = profile.preferences?.categories;
        if (Array.isArray(saved) && saved.length) setCategories(saved as string[]);
        setStats(s);
      })
      .catch(() => setStatus({ ok: false, text: "Your profile couldn't be loaded. Try logging in again." }))
      .finally(() => setLoading(false));
  }, []);

  function toggleCategory(key: string) {
    setCategories((cur) => (cur.includes(key) ? cur.filter((c) => c !== key) : [...cur, key]));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const updated = await api.updateProfile({ display_name: name, avatar: look, categories });
      setMe(updated);
      setStatus({ ok: true, text: 'Profile saved.' });
    } catch (err) {
      setStatus({ ok: false, text: err instanceof Error ? err.message : "Your profile couldn't be saved." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="font-display text-2xl text-center py-20">Loading…</p>;
  if (!me) return <p className="notice">{status?.text ?? 'Log in to see your profile.'}</p>;

  return (
    <form onSubmit={save} className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
      <section className="window lg:col-span-2 space-y-5 lg:sticky lg:top-6" aria-label="Character preview">
        <div className="flex justify-center">
          <Avatar look={look} size={144} name={name} />
        </div>
        <p className="font-display text-2xl text-center break-words">{name || me.username}</p>
        <div className="flex items-center gap-4">
          <LevelBadge level={stats.level} />
          <div className="flex-1">
            <XPBar level={stats.level} xpInLevel={stats.xp_in_level} xpToNext={stats.xp_to_next} />
          </div>
        </div>
        <p className="text-ink-mist">Total EXP <span className="font-display text-3xl text-ink ml-2">{stats.total_xp.toLocaleString()}</span></p>
        <StreakFlame count={stats.current_streak} />
      </section>

      <div className="lg:col-span-3 space-y-6">
        <section className="window space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1>Wardrobe</h1>
            <button type="button" className="btn" onClick={() => setLook(randomLook())}>Randomize</button>
          </div>

          <div>
            <label className="label" htmlFor="dname">Name</label>
            <input id="dname" className="field" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={30} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            {WARDROBE.map(({ key, label, options }) => (
              <div key={key}>
                <label className="label" htmlFor={`look-${key}`}>{label}</label>
                <select
                  id={`look-${key}`}
                  className="field cursor-pointer"
                  value={look[key]}
                  onChange={(e) => setLook({ ...look, [key]: e.target.value })}
                >
                  {options.map(([value, text]) => (
                    <option key={value} value={value}>{text}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>

        <section className="window">
          <h2>Quests you want</h2>
          <p className="mt-1 text-ink-mist">Hazel picks from these when posting your daily quests.</p>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map(({ key, label, hint }) => (
              <li key={key}>
                <label className="window-inset flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={categories.includes(key)} onChange={() => toggleCategory(key)} className="w-5 h-5 accent-gold" />
                  <Sprite rows={ITEMS[key].rows} palette={ITEMS[key].palette} size={28} />
                  <span>
                    <span className="font-display text-xl block">{label}</span>
                    <span className="text-base text-ink-mist">{hint}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <button className="btn btn-primary" disabled={saving || categories.length === 0}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          {categories.length === 0 && <span className="text-ink-mist">Pick at least one kind of quest.</span>}
          {status && <span className={status.ok ? 'font-display text-xs text-jade' : 'notice'} role="status">{status.text}</span>}
        </div>
      </div>
    </form>
  );
}
