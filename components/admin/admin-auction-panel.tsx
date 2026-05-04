'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AuctionRoom, Player, Team } from '@/lib/types';
import { currency, formatCategory } from '@/lib/utils';

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
    <div className="panel p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="badge">Live control room</p>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.12em]">Run auctions</h2>
        </div>
        {message ? <p className="text-sm text-white/70">{message}</p> : null}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {rooms.map((room) => {
          const currentPlayer = players.find((player) => player.id === room.current_player_id);
          const winningTeam = teams.find((team) => team.id === room.current_highest_team_id);
          return (
            <div key={room.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="badge">{room.division === 'men' ? 'Male Futsal' : 'Female Futsal'}</p>
                  <h3 className="mt-3 text-2xl font-black uppercase tracking-[0.12em]">{room.status}</h3>
                </div>
                <div className="rounded-2xl border border-white/10 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/55">Current bid</p>
                  <p className="mt-1 text-2xl font-black text-lime">{currency(room.current_bid)}</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="space-y-2 block">
                  <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Nominate player</span>
                  <select id={`player-${room.id}`} className="w-full rounded-2xl border border-white/10 bg-pitch px-4 py-3 outline-none">
                    <option value="">Select a player</option>
                    {availableByDivision[room.division].map((player) => (
                      <option key={player.id} value={player.id}>{player.name} · {formatCategory(player.category)} · {currency(player.base_price)}</option>
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
                    className="rounded-2xl bg-cyan px-5 py-3 font-black uppercase tracking-[0.16em] text-pitch transition hover:bg-white disabled:bg-white/10 disabled:text-white/40"
                  >
                    Start lot
                  </button>
                  <button
                    disabled={!room.current_player_id || (isPending && busyKey === `unsold-${room.id}`)}
                    onClick={() => runAction('/api/admin/auction/close', { roomId: room.id, outcome: 'unsold' }, `unsold-${room.id}`)}
                    className="rounded-2xl border border-white/10 px-5 py-3 font-black uppercase tracking-[0.16em] text-white transition hover:border-magenta/40 hover:bg-white/5 disabled:text-white/40"
                  >
                    Mark unsold
                  </button>
                </div>
                <button
                  disabled={!room.current_player_id || !room.current_highest_team_id || (isPending && busyKey === `sold-${room.id}`)}
                  onClick={() => runAction('/api/admin/auction/close', { roomId: room.id, outcome: 'sold' }, `sold-${room.id}`)}
                  className="w-full rounded-2xl bg-lime px-5 py-3 font-black uppercase tracking-[0.16em] text-pitch transition hover:bg-white disabled:bg-white/10 disabled:text-white/40"
                >
                  Sell to current highest bidder
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                <p><span className="font-semibold text-white">Current player:</span> {currentPlayer ? `${currentPlayer.name} · ${formatCategory(currentPlayer.category)}` : 'None'}</p>
                <p className="mt-2"><span className="font-semibold text-white">Highest bidder:</span> {winningTeam?.name ?? 'None yet'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
