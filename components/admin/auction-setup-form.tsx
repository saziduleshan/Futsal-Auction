'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gavel, Swords, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import type { Team, PlayerCategory } from '@/lib/types';

const POSITION_OPTIONS: { value: PlayerCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All players' },
  { value: 'defender', label: 'Defenders only' },
  { value: 'midfielder', label: 'Midfielders only' },
  { value: 'forward', label: 'Forwards only' },
  { value: 'goalkeeper', label: 'Goalkeepers only' }
];

interface AuctionSetupFormProps {
  teams: Team[];
}

export function AuctionSetupForm({ teams }: AuctionSetupFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [division, setDivision] = useState<'men' | 'women'>('men');
  const [teamCount, setTeamCount] = useState(8);
  const [purseSize, setPurseSize] = useState(1500);
  const [playerSelection, setPlayerSelection] = useState<PlayerCategory | 'all'>('all');

  const divisionTeams = teams.filter((t) => t.division === division);
  const maxTeams = Math.min(divisionTeams.length, 8);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      const res = await fetch('/api/admin/auction/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ division, teamCount, purseSize })
      });
      const payload = await res.json();
      if (res.ok) {
        router.push('/auction');
      } else {
        setError(payload.message || 'Failed to create auction room.');
      }
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-base font-bold uppercase tracking-[0.18em] text-[#0F2838] transition hover:text-[#0F2838]/70"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to admin
        </Link>
        <h2 className="text-3xl font-black uppercase tracking-[0.12em] text-gold [-webkit-text-stroke:1px_black]">
          Create auction room
        </h2>
      </div>

      <form onSubmit={handleCreate} className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-black/60 p-8 shadow-lg backdrop-blur-xl">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-gray-300">
              <Users className="mr-1.5 inline h-4 w-4" />
              Division
            </span>
            <select
              value={division}
              onChange={(e) => {
                const val = e.target.value as 'men' | 'women';
                setDivision(val);
                const available = teams.filter((t) => t.division === val).length;
                setTeamCount(Math.min(8, available));
              }}
              className="w-full rounded-2xl border border-white/30 bg-white/70 px-4 py-3 text-gray-900 outline-none backdrop-blur-sm transition focus:border-gold focus:ring-1 focus:ring-gold/30"
            >
              <option value="men">Male Futsal</option>
              <option value="women">Female Futsal</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-gray-300">
              <Swords className="mr-1.5 inline h-4 w-4" />
              Number of teams
            </span>
            <input
              type="number"
              min={2}
              max={maxTeams}
              value={teamCount}
              onChange={(e) => setTeamCount(Math.min(Number(e.target.value), maxTeams))}
              className="w-full rounded-2xl border border-white/30 bg-white/70 px-4 py-3 text-gray-900 outline-none backdrop-blur-sm transition focus:border-gold focus:ring-1 focus:ring-gold/30"
            />
            <p className="text-xs text-gray-400">Max {maxTeams} teams available for {division} division</p>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-gray-300">
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
              className="w-full rounded-2xl border border-white/30 bg-white/70 px-4 py-3 text-gray-900 outline-none backdrop-blur-sm transition focus:border-gold focus:ring-1 focus:ring-gold/30"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-gray-300">
              <Users className="mr-1.5 inline h-4 w-4" />
              Players to include
            </span>
            <div className="flex flex-wrap gap-3">
              {POSITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPlayerSelection(opt.value)}
                  className={`rounded-xl border px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] transition ${
                    playerSelection === opt.value
                      ? 'border border-gold bg-[#1D3C50] text-white shadow-sm ring-2 ring-gold/60'
                      : 'border border-white/20 bg-black/60 text-gold/80 shadow-lg backdrop-blur-sm hover:border-white/40 hover:bg-black/70 hover:text-gold'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </label>
        </div>

        <button
          disabled={isPending}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1D3C50] px-6 py-4 font-black uppercase tracking-[0.16em] text-white shadow-lg transition hover:bg-[#0F2838] disabled:bg-gray-600 disabled:text-gray-400"
        >
          <Gavel className="h-5 w-5" />
          {isPending ? 'Creating...' : 'Create auction room'}
        </button>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-600">{error}</p>
        )}
      </form>
    </div>
  );
}
