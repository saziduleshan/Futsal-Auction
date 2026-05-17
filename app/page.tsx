'use client';

import { useState } from 'react';
import Image from 'next/image';
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/75" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-6 text-center">
        <Image
          src="/joga-bonito-logo.png"
          alt="Joga Bonito"
          width={800}
          height={250}
          className="h-auto w-full max-w-xl"
          priority
        />

        <p className="mt-6 whitespace-nowrap text-2xl font-black tracking-[0.22em] text-[#f5c542] drop-shadow-lg md:text-3xl">
          PLAY IT. LIVE IT. OWN IT.
        </p>

        <div className="mt-12 w-full rounded-3xl border border-white/20 bg-black/60 p-8 backdrop-blur-2xl">
          <div className="mb-6 flex rounded-2xl border border-white/15 bg-black/30 p-1">
            <button
              onClick={() => setMode('admin')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] transition ${
                mode === 'admin'
                  ? 'bg-white text-[#1a1a1a] shadow-lg'
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
                  ? 'bg-white text-[#1a1a1a] shadow-lg'
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
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-[#f5c542]/60 focus:bg-black/50"
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
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-[#f5c542]/60 focus:bg-black/50"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5c542] px-5 py-4 font-black uppercase tracking-[0.16em] text-[#1a1a1a] shadow-lg transition hover:bg-white"
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
