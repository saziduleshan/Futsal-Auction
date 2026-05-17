'use client';

import { useState, useTransition } from 'react';
import { ArrowLeft, Gavel, Settings, Swords, Users, Wallet } from 'lucide-react';
import Link from 'next/link';

export function AuctionSetupForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [division, setDivision] = useState<'men' | 'women'>('men');
  const [teamCount, setTeamCount] = useState(8);
  const [purseSize, setPurseSize] = useState(1500);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/auction/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ division, teamCount, purseSize })
        });
        const payload = await res.json();
        if (res.ok) {
          setMessage(payload.message || 'Auction room created!');
        } else {
          setError(payload.message || 'Failed to create auction room.');
        }
      } catch {
        setError('Could not connect to server. Please try again.');
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold hover:text-gold/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to admin
        </Link>
        <p className="badge border-gold/30 text-gold">Auction setup</p>
        <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.12em]">
          Create auction room
        </h2>
      </div>

      <form onSubmit={handleCreate} className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white p-8 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500">
              <Users className="mr-1.5 inline h-4 w-4" />
              Division
            </span>
            <select
              value={division}
              onChange={(e) => {
                const val = e.target.value as 'men' | 'women';
                setDivision(val);
                setTeamCount(val === 'men' ? 8 : 3);
              }}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/30"
            >
              <option value="men">Male Futsal</option>
              <option value="women">Female Futsal</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500">
              <Swords className="mr-1.5 inline h-4 w-4" />
              Number of teams
            </span>
            <input
              type="number"
              min={2}
              max={20}
              value={teamCount}
              onChange={(e) => setTeamCount(Number(e.target.value))}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/30"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500">
              <Wallet className="mr-1.5 inline h-4 w-4" />
              Purse size per team ($)
            </span>
            <input
              type="number"
              min={100}
              max={10000}
              step={50}
              value={purseSize}
              onChange={(e) => setPurseSize(Number(e.target.value))}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/30"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500">
              <Settings className="mr-1.5 inline h-4 w-4" />
              Starting bid increment ($)
            </span>
            <input
              type="number"
              min={5}
              max={500}
              step={5}
              defaultValue={25}
              name="bidIncrement"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/30"
            />
          </label>
        </div>

        <button
          disabled={isPending}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-gold to-orange px-6 py-4 font-black uppercase tracking-[0.16em] text-white shadow-lg transition hover:from-gray-800 hover:to-gray-800 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400"
        >
          <Gavel className="h-5 w-5" />
          {isPending ? 'Creating...' : 'Create auction room'}
        </button>

        {message && (
          <p className="mt-4 rounded-2xl bg-lime/10 px-4 py-3 text-sm font-bold text-lime">{message}</p>
        )}
        {error && (
          <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-600">{error}</p>
        )}
      </form>
    </div>
  );
}
