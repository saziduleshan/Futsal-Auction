'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AuctionRoom, Player, Team } from '@/lib/types';
import { currency } from '@/lib/utils';

export function AdminAuctionPanel({ rooms, players, teams }: { rooms: AuctionRoom[]; players: Player[]; teams: Team[] }) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableByDivision = useMemo(() => ({
    men: players.filter((player) => player.division === 'men' && player.status === 'available'),
    women: players.filter((player) => player.division === 'women' && player.status === 'available')
  }), [players]);

  function runAction(url: string, body: Record<string, unknown>, key: string) {
    setBusyKey(key);
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      setMessage(payload.message ?? (response.ok ? 'Action completed.' : 'Action failed.'));
      setBusyKey(null);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-gray-400/40 shadow-lg backdrop-blur-xl">
      <div className="border-b border-white/10 p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="badge">Live control room</p>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.12em] text-gold">Run auctions</h2>
          </div>
          {message ? <p className="text-sm font-semibold text-gray-500">{message}</p> : null}
        </div>
      </div>

      <div className="grid gap-6 p-8 xl:grid-cols-2">
        {rooms.map((room) => {
          const currentPlayer = players.find((player) => player.id === room.current_player_id);
          const winningTeam = teams.find((team) => team.id === room.current_highest_team_id);
          return (
            <div key={room.id} className={`rounded-[1.75rem] border p-6 transition ${
              room.status === 'live'
                ? 'border-gold/30 bg-gradient-to-br from-gold/[0.06] to-transparent shadow-md'
                : 'border-white/20 bg-white/50'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="badge">{room.division === 'men' ? 'Male Futsal' : 'Female Futsal'}</p>
                  <h3 className={`mt-3 text-2xl font-black uppercase tracking-[0.12em] ${
                    room.status === 'live' ? 'text-gold' : ''
                  }`}>{room.status}</h3>
                </div>
                <div className={`rounded-2xl border px-4 py-3 text-right ${
                  room.status === 'live'
                    ? 'border-gold/30 bg-gradient-to-br from-gold/[0.08] to-transparent'
                    : 'border-white/20 bg-gray-400/30'
                }`}>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-300">Current bid</p>
                  <p className="mt-1 text-2xl font-black text-gold">{currency(room.current_bid)}</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="space-y-2 block">
                  <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Nominate player</span>
                  <select id={`player-${room.id}`} className="w-full rounded-2xl border border-white/30 bg-white/70 px-4 py-3 text-gray-900 outline-none backdrop-blur-sm transition focus:border-gold focus:ring-1 focus:ring-gold/30">
                    <option value="">Select a player</option>
                    {availableByDivision[room.division].map((player) => (
                      <option key={player.id} value={player.id}>{player.name} · {currency(player.base_price)}</option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    disabled={isPending && busyKey === `start-${room.id}`}
                    onClick={() => {
                      const element = document.getElementById(`player-${room.id}`) as HTMLSelectElement | null;
                      if (!element?.value) {
                        setMessage('Please choose a player before starting the lot.');
                        return;
                      }
                      runAction('/api/admin/auction/start', { roomId: room.id, playerId: element.value }, `start-${room.id}`);
                    }}
                    className="rounded-2xl bg-gradient-to-r from-gold to-orange px-5 py-3 font-black uppercase tracking-[0.16em] text-white shadow transition hover:from-gray-800 hover:to-gray-800 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400"
                  >
                    Start lot
                  </button>
                  <button
                    disabled={!room.current_player_id || (isPending && busyKey === `unsold-${room.id}`)}
                    onClick={() => runAction('/api/admin/auction/close', { roomId: room.id, outcome: 'unsold' }, `unsold-${room.id}`)}
                    className="rounded-2xl border border-white/20 bg-gray-400/30 px-5 py-3 font-black uppercase tracking-[0.16em] text-gray-200 backdrop-blur-sm transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-400 disabled:text-gray-500"
                  >
                    Mark unsold
                  </button>
                </div>
                <button
                  disabled={!room.current_player_id || !room.current_highest_team_id || (isPending && busyKey === `sold-${room.id}`)}
                  onClick={() => runAction('/api/admin/auction/close', { roomId: room.id, outcome: 'sold' }, `sold-${room.id}`)}
                  className="w-full rounded-2xl bg-gradient-to-r from-lime to-cyan px-5 py-3 font-black uppercase tracking-[0.16em] text-white shadow transition hover:from-gray-800 hover:to-gray-800 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400"
                >
                  Sell to current highest bidder
                </button>
              </div>

              <div className={`mt-6 rounded-2xl border p-4 text-sm ${
                room.status === 'live'
                  ? 'border-gold/20 bg-gold/[0.04] text-gold/80'
                  : 'border-white/20 bg-white/50 text-gray-400'
              }`}>
                <p><span className="font-semibold text-gray-100">Current player:</span> {currentPlayer ? currentPlayer.name : 'None'}</p>
                <p className="mt-2"><span className="font-semibold text-gray-100">Highest bidder:</span> {winningTeam?.name ?? 'None yet'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
