'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Shield, User } from 'lucide-react';

export default function HomePage() {
  const [mode, setMode] = useState<'admin' | 'manager'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      const data = await res.json();
      router.push(data.redirect || '/auction');
    } else {
      const data = await res.json();
      setError(data.message || 'Invalid credentials');
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-pitch">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/joga-bonito-bg.jpg)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-6 text-center">
        <div className="mb-2 inline-flex items-center gap-3 rounded-full bg-white/20 px-5 py-2 text-sm font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-brazil-yellow" />
          Futsal Tournament 2026
          <span className="h-2 w-2 rounded-full bg-brazil-yellow" />
        </div>

        <h1 className="mt-6 text-6xl font-black uppercase leading-none tracking-[0.02em] text-white drop-shadow-lg md:text-8xl">
          Joga Bonito
        </h1>
        <p className="mt-1 text-3xl font-black tracking-[0.25em] text-white/90 md:text-4xl">2026</p>
        <p className="mt-6 text-xl font-semibold tracking-[0.2em] text-white drop-shadow">
          PLAY IT. LIVE IT. OWN IT.
        </p>

        <div className="mt-12 w-full rounded-3xl border border-white/30 bg-white/10 p-8 backdrop-blur-xl">
          <div className="mb-6 flex rounded-2xl border border-white/20 bg-white/5 p-1">
            <button
              onClick={() => setMode('admin')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] transition ${
                mode === 'admin'
                  ? 'bg-white text-[#006633] shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </button>
            <button
              onClick={() => setMode('manager')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] transition ${
                mode === 'manager'
                  ? 'bg-white text-[#006633] shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <User className="h-4 w-4" />
              Manager
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                {mode === 'admin' ? 'Admin Username' : 'Manager Username'}
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-white/50 focus:bg-white/15"
                placeholder={mode === 'admin' ? 'e.g. admin' : 'e.g. team-men-1'}
              />
            </div>
            <div className="text-left">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-white/50 focus:bg-white/15"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-4 font-black uppercase tracking-[0.16em] text-[#006633] shadow-lg transition hover:bg-[#ffcc00] hover:text-[#006633]"
            >
              <LogIn className="h-5 w-5" />
              Enter the Arena
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
