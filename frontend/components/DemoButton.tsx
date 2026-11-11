'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// Shows a one-click "Try the demo" login when the server has the demo account enabled.
export default function DemoButton({ className = '' }: { className?: string }) {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .demoAvailable()
      .then((res) => setAvailable(res.available))
      .catch(() => setAvailable(false));
  }, []);

  if (!available) return null;

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
