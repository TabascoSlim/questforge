'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import DemoButton from '@/components/DemoButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.login(email, password);
      api.setToken(result.access_token);
      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error && err.message !== 'Invalid credentials' ? err.message : 'That email and password don’t match. Check them and try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto window space-y-4">
      <h1>Log in</h1>
      {error && <p className="notice" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? 'Logging in…' : 'Log in'}</button>
      </form>
      <DemoButton />
      <p className="text-center">
        New here? <a href="/auth/register" className="underline decoration-2 underline-offset-2">Create an account</a>
      </p>
    </div>
  );
}
