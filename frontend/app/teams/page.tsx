'use client';

import { useEffect, useState } from 'react';
import { api, Guild, GuildMember, GuildSummary } from '@/lib/api';
import Avatar from '@/components/Avatar';

export default function GuildPage() {
  const [guild, setGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [guilds, setGuilds] = useState<GuildSummary[]>([]);
  const [code, setCode] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      const mine = await api.myGuild();
      setGuild(mine.team);
      setMembers(mine.members);
      if (!mine.team) setGuilds(await api.listGuilds());
    } catch {
      setError("I couldn't load guilds. Check that the server is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(action: () => Promise<unknown>): Promise<boolean> {
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!guild?.invite_code) return;
    try {
      await navigator.clipboard.writeText(guild.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (loading) return <p className="font-display text-3xl text-center py-20">Walking to the guild hall…</p>;

  if (guild) {
    return (
      <div className="space-y-5">
        <section className="window">
          <h1>{guild.name}</h1>
          <p className="mt-1">
            {guild.member_count} of {guild.seat_count} seats filled. Quests you finish also count toward the guild leaderboard.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-display text-2xl">Invite code</span>
            <code className="font-display text-4xl font-bold bg-frame-shadow border-4 border-frame px-3 py-1">{guild.invite_code}</code>
            <button className="btn" onClick={copyCode}>{copied ? 'Copied' : 'Copy code'}</button>
          </div>
          <p className="mt-2 text-sm text-ink-mist">Share it with a friend so they can join from their Guild page.</p>
        </section>

        <section className="window" aria-labelledby="roster">
          <h2 id="roster">Members</h2>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((m) => (
              <li key={m.id} className={`flex items-center gap-3 window-inset${m.is_you ? ' ring-2 ring-gold' : ''}`}>
                <Avatar look={m.avatar} size={44} name={m.display_name || m.username} />
                <span className="font-display text-3xl truncate">
                  {m.display_name || m.username}
                  {m.is_you && <span className="ml-2 text-xl text-gold">(you)</span>}
                </span>
                {m.is_owner && <span className="ml-auto font-display text-2xl text-jade">Founder</span>}
              </li>
            ))}
          </ul>
        </section>

        {error && <p className="notice">{error}</p>}
        <button className="btn btn-danger" disabled={busy} onClick={() => run(() => api.leaveGuild())}>
          Leave {guild.name}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="window">
        <h1>Guild hall</h1>
        <p className="mt-1">Guilds are small groups who cheer each other on and share a leaderboard. Join one, or start your own.</p>
      </header>

      {error && <p className="notice">{error}</p>}

      <section className="window" aria-labelledby="browse">
        <h2 id="browse">Guilds looking for members</h2>
        {guilds.length === 0 ? (
          <p className="mt-2">No guilds yet. Be the first to found one below.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {guilds.map((g) => (
              <li key={g.id} className="window-inset flex flex-wrap items-center gap-3">
                <span className="font-display text-3xl flex-1 min-w-[10rem]">{g.name}</span>
                <span className="text-sm">{g.member_count} of {g.seat_count} seats</span>
                <button
                  className="btn btn-primary"
                  disabled={busy || g.is_full}
                  onClick={() => run(() => api.joinGuild(g.id))}
                >
                  {g.is_full ? 'Full' : `Join ${g.name}`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <form
          className="window space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => api.joinGuildByCode(code)).then((ok) => ok && setCode(''));
          }}
        >
          <h2>Have an invite code?</h2>
          <label className="label" htmlFor="code">Invite code</label>
          <input
            id="code"
            className="field font-display text-2xl uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="MILL-2048"
            required
          />
          <button className="btn btn-primary w-full" disabled={busy}>Join with code</button>
        </form>

        <form
          className="window space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => api.createGuild(newName)).then((ok) => ok && setNewName(''));
          }}
        >
          <h2>Found a guild</h2>
          <label className="label" htmlFor="gname">Guild name</label>
          <input
            id="gname"
            className="field"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="The Early Risers"
            minLength={3}
            maxLength={40}
            required
          />
          <button className="btn btn-gold w-full" disabled={busy}>Found guild</button>
        </form>
      </div>
    </div>
  );
}
