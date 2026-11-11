'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type ServerState = 'checking' | 'waking' | 'ready' | 'off' | 'unreachable';

// The free demo server naps when nobody is around and takes up to a minute to wake.
const RETRY_EVERY_MS = 5000;
const GIVE_UP_AFTER_MS = 150000;

// Shows a one-click "Try the demo" login when the server has the demo account enabled,
// and a friendly "waking up" message while a sleeping server starts.
export default function DemoButton({ className = '' }: { className?: string }) {
  const [server, setServer] = useState<ServerState>('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const started = Date.now();

    const check = async () => {
      try {
        const res = await api.demoAvailable();
        if (!cancelled) setServer(res.available ? 'ready' : 'off');
      } catch {
        if (cancelled) return;
        if (Date.now() - started > GIVE_UP_AFTER_MS) {
          setServer('unreachable');
          return;
        }
        setServer('waking');
        timer = setTimeout(check, RETRY_EVERY_MS);
      }
    };
    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (server === 'off' || server === 'checking') return null;

  if (server === 'waking' || server === 'unreachable') {
    return (
      <div className={className} role="status" aria-live="polite">
        <button type="button" disabled className="btn btn-gold w-full">
          {server === 'waking' ? 'Waking the game server…' : 'Game server is still asleep'}
        </button>
        <p className="mt-2 text-ink-mist">
          {server === 'waking'
            ? 'This demo runs on free hosting that naps when nobody is around. It takes up to a minute to start.'
            : 'It didn’t wake up in time. Refresh the page to try again.'}
        </p>
      </div>
    );
  }

  async function handleClick() {
    setError('');
    setLoading(true);
    try {
      const result = await api.demoLogin();
      api.setToken(result.access_token);
      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn btn-gold w-full"
      >
        {loading ? 'Entering the demo…' : 'Try the demo (no sign-up)'}
      </button>
      {error && <p className="mt-2 notice">{error}</p>}
    </div>
  );
}
