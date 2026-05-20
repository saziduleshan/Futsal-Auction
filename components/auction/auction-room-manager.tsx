'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Play, Loader2, Shield, Sparkles, Target, Trophy,
  Gavel, X, Check, Users, Banknote, ArrowLeft, Eye, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { currency, formatCategory } from '@/lib/utils';
import { getYearTier } from '@/lib/constants';
import type { AuctionRoom, Player, Team, PlayerCategory, Bid } from '@/lib/types';

const POSITIONS: { key: PlayerCategory; label: string; Icon: typeof Shield }[] = [
  { key: 'defender', label: 'Defenders', Icon: Shield },
  { key: 'midfielder', label: 'Midfielders', Icon: Sparkles },
  { key: 'forward', label: 'Forwards', Icon: Target },
  { key: 'goalkeeper', label: 'Goalkeepers', Icon: Trophy }
];

interface AuctionRoomManagerProps {
  division: string;
  room: AuctionRoom;
  players: Player[];
  soldPlayers: Player[];
  teams: Team[];
}

export function AuctionRoomManager({ division, room: initialRoom, players, soldPlayers, teams }: AuctionRoomManagerProps) {
  const router = useRouter();

  const [room, setRoom] = useState(initialRoom);
  const [activeBatch, setActiveBatch] = useState<PlayerCategory | null>(null);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [managersOpen, setManagersOpen] = useState(false);

  const batchPlayers = useMemo(() => {
    if (!activeBatch) return [];
    return players.filter((p) => p.category === activeBatch);
  }, [players, activeBatch]);

  const isBatchComplete = activeBatch !== null && playerIndex >= batchPlayers.length;

  const batchedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pos of POSITIONS) {
      counts[pos.key] = players.filter((p) => p.category === pos.key).length;
    }
    return counts;
  }, [players]);

  const highestBidder = useMemo(() => {
    if (!room.current_highest_team_id) return null;
    return teams.find((t) => t.id === room.current_highest_team_id) ?? null;
  }, [room.current_highest_team_id, teams]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`auction-room-${room.division}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'auction_rooms',
        filter: `division=eq.${room.division}`
      }, (payload) => {
        const updated = payload.new as AuctionRoom;
        setRoom(updated);
        if (!updated.current_player_id && currentPlayer) {
          setCurrentPlayer(null);
        } else if (updated.current_player_id && !currentPlayer) {
          setRoom(updated);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room.division]);

  const runBatch = useCallback(async (position: PlayerCategory) => {
    setActiveBatch(position);
    setPlayerIndex(0);
    setCurrentPlayer(null);
    setMessage(null);

    const positionPlayers = players.filter((p) => p.category === position);
    if (positionPlayers.length === 0) {
      setMessage(`No available ${formatCategory(position)}s.`);
      return;
    }

    await startPlayer(positionPlayers[0]);
  }, [players]);

  const startPlayer = useCallback(async (player: Player) => {
    setIsStarting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/auction/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, playerId: player.id })
      });
      const payload = await res.json();
      if (res.ok) {
        setCurrentPlayer(player);
        setMessage(null);
      } else {
        setMessage(payload.message || 'Failed to start player.');
      }
    } catch {
      setMessage('Could not start the auction lot.');
    } finally {
      setIsStarting(false);
    }
  }, [room.id]);

  const closeLot = useCallback(async (outcome: 'sold' | 'unsold') => {
    if (!currentPlayer) return;
    setIsClosing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/auction/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, outcome })
      });
      const payload = await res.json();
      if (res.ok) {
        const nextIndex = playerIndex + 1;
        if (nextIndex < batchPlayers.length) {
          setMessage(`Starting next ${formatCategory(currentPlayer.category)}...`);
          await new Promise((r) => setTimeout(r, 1500));
          await startPlayer(batchPlayers[nextIndex]);
          setPlayerIndex(nextIndex);
        } else {
          setCurrentPlayer(null);
          setMessage('Batch complete! All players in this position have been auctioned.');
          setActiveBatch(null);
        }
      } else {
        setMessage(payload.message || 'Failed to close lot.');
      }
    } catch {
      setMessage('Could not close the auction lot.');
    } finally {
      setIsClosing(false);
    }
  }, [currentPlayer, room.id, playerIndex, batchPlayers, startPlayer]);

  const inProgress = activeBatch !== null && !isBatchComplete && currentPlayer !== null;

  const tierInfo = currentPlayer ? getYearTier(currentPlayer.year) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/auction-setup"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to setup
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-gray-900">
            {division === 'men' ? 'Male Futsal' : 'Female Futsal'} Auction
          </h1>
        </div>
        {activeBatch && (
          <div className="text-right">
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-gray-400">Active batch</p>
            <p className="text-lg font-black text-gray-900">{formatCategory(activeBatch)}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {POSITIONS.map(({ key, label, Icon }) => {
          const count = batchedCounts[key];
          const isActive = activeBatch === key;
          return (
            <button
              key={key}
              onClick={() => { if (!inProgress) runBatch(key); }}
              disabled={inProgress || count === 0}
              className="group relative flex items-center gap-3 rounded-2xl border-2 px-6 py-4 text-left transition disabled:opacity-40"
              style={{
                borderColor: isActive ? '#f5c542' : '#e5e7eb',
                backgroundColor: isActive ? '#fffbeb' : '#ffffff',
                boxShadow: isActive ? '0 4px 12px rgba(245, 197, 66, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl transition"
                style={{ backgroundColor: isActive ? '#f5c542' : '#f3f4f6' }}
              >
                <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className={`text-sm font-bold uppercase tracking-[0.08em] ${isActive ? 'text-gold' : 'text-gray-900'}`}>
                  {label}
                </p>
                <p className="text-xs text-gray-400">{count} players</p>
              </div>

              {!inProgress && count > 0 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-bold text-white shadow-lg">
                    <Play className="h-4 w-4" /> Run this batch
                  </span>
                </div>
              )}

              {isActive && (
                <div className="ml-auto">
                  {isBatchComplete ? (
                    <span className="rounded-full bg-lime/20 px-3 py-1 text-xs font-bold text-lime">Done</span>
                  ) : (
                    <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold">
                      {Math.min(playerIndex + 1, batchPlayers.length)}/{batchPlayers.length}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {message && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-700">
          {message}
        </div>
      )}

      {isStarting && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white py-24">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-lg font-bold text-gray-500">Starting player...</p>
        </div>
      )}

      {currentPlayer && !isStarting && (
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex-shrink-0 lg:w-80 animate-slide-from-left">
              {currentPlayer.card_image_url ? (
                <Image
                  src={currentPlayer.card_image_url}
                  alt={currentPlayer.name}
                  width={360}
                  height={450}
                  className="aspect-[4/5] w-full rounded-xl object-cover shadow-[0_8px_30px_rgb(0,0,0,0.35)]"
                  priority
                />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
                  <Shield className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="rounded-full border border-gray-300 px-3 py-1 text-sm font-bold uppercase tracking-[0.08em] text-gray-600">
                    {formatCategory(currentPlayer.category)}
                  </p>
                  {tierInfo && (
                    <p className="rounded-full bg-gold/10 px-3 py-1 text-sm font-bold text-gold">
                      {tierInfo.tier}
                    </p>
                  )}
                </div>
                <h2 className="mt-4 text-4xl font-black text-gray-900">{currentPlayer.name}</h2>
              </div>

              <div className="rounded-2xl border-2 border-gray-100 bg-gray-50 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Current bid</p>
                <p id="current-bid-display" className="mt-2 text-5xl font-black text-gold drop-shadow-sm transition-all">
                  ${currency(room.current_bid)}
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <p className="text-gray-500">
                    Base: <span className="font-bold text-gray-700">${currency(currentPlayer.base_price)}</span>
                  </p>
                  {highestBidder && (
                    <p className="text-gray-500">
                      Highest: <span className="font-bold text-gray-700">{highestBidder.name}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <button
                  disabled={isClosing}
                  onClick={() => closeLot('unsold')}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-300 px-5 py-4 font-bold text-gray-600 transition hover:border-red-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                >
                  <X className="h-5 w-5" /> Mark unsold
                </button>
                <button
                  disabled={isClosing || !room.current_highest_team_id}
                  onClick={() => closeLot('sold')}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lime to-cyan px-5 py-4 font-black text-white shadow transition hover:from-gray-800 hover:to-gray-800 disabled:opacity-40"
                >
                  {isClosing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                  Sell to highest bidder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeBatch && !currentPlayer && !isStarting && !isBatchComplete && !isClosing && (
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-16">
          <div className="text-center">
            <Play className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-lg font-bold text-gray-400">Ready — player at index {playerIndex}</p>
            <button
              onClick={() => startPlayer(batchPlayers[playerIndex])}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 font-bold text-white shadow transition hover:bg-gold/90"
            >
              <Gavel className="h-4 w-4" /> Start this player
            </button>
          </div>
        </div>
      )}

      {isBatchComplete && (
        <div className="rounded-2xl border-2 border-lime/30 bg-lime/5 py-12 text-center">
          <Trophy className="mx-auto h-12 w-12 text-lime" />
          <p className="mt-3 text-2xl font-black text-lime">Batch complete!</p>
          <p className="mt-1 text-gray-500">
            All {formatCategory(activeBatch!)} have been auctioned. Run another batch above.
          </p>
        </div>
      )}

      <button
        onClick={() => setManagersOpen(true)}
        className="flex items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white px-6 py-4 shadow-sm transition hover:border-gold hover:shadow-md"
      >
        <Eye className="h-6 w-6 text-gray-400" />
        <span className="text-lg font-bold text-gray-900">Managers</span>
        <span className="ml-auto text-sm text-gray-400">{teams.length} teams</span>
      </button>

      {managersOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-gray-900" />
              <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-gray-900">Managers</h2>
            </div>
            <button
              onClick={() => setManagersOpen(false)}
              className="flex items-center gap-2 rounded-xl border-2 border-gray-200 px-5 py-2.5 font-bold text-gray-600 transition hover:border-gray-400 hover:text-gray-900"
            >
              <ChevronDown className="h-5 w-5" /> Minimize
            </button>
          </div>

          <div className="flex-1 overflow-auto px-6 py-6">
            <div className="overflow-hidden rounded-2xl border-2 border-gray-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="px-5 py-4 font-bold uppercase tracking-[0.1em] text-gray-500">Team</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-[0.1em] text-gray-500">Purse remaining</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-[0.1em] text-gray-500">Players bought</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => {
                    const bought = soldPlayers.filter((p) => p.sold_to_team_id === team.id);
                    const spent = bought.reduce((sum, p) => sum + (p.sold_price ?? 0), 0);
                    const remaining = team.purse - spent;
                    return (
                      <tr key={team.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-5 py-4 font-bold text-gray-900">{team.name}</td>
                        <td className="px-5 py-4">
                          <span className={`font-bold ${remaining > 0 ? 'text-lime' : 'text-red-500'}`}>
                            ${currency(remaining)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {bought.length === 0 ? (
                            <span className="text-gray-400">None yet</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {bought.map((p) => (
                                <span key={p.id} className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-700">
                                  {p.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
