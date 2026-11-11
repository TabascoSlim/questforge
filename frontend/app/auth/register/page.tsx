'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.register(email, username, password);
      api.setToken(result.access_token);
      window.location.href = '/profile';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Your account couldn't be created. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto window space-y-4">
      <h1>Create an account</h1>
      <p>You'll pick your farmer's look on the next screen.</p>
      {error && <p className="notice" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" autoComplete="username" className="field" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={50} required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="new-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          <p className="text-sm text-ink-mist mt-1">At least 8 characters.</p>
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? 'Creating your account…' : 'Create account'}</button>
      </form>
      <p className="text-center">
        Already have an account? <a href="/auth/login" className="underline decoration-2 underline-offset-2">Log in</a>
      </p>
    </div>
  );
}
