'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Play, Loader2, Shield, Sparkles, Target, Trophy, Gavel, X, Check, Users, Banknote, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { AuctionRoom, Player, Team, PlayerCategory } from '@/lib/types';
import { currency, formatCategory } from '@/lib/utils';

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
  teams: Team[];
}

export function AuctionRoomManager({ division, room, players, teams }: AuctionRoomManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeBatch, setActiveBatch] = useState<PlayerCategory | null>(null);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const [teamPurses, setTeamPurses] = useState<Record<string, number>>({});

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    setTeamPurses(Object.fromEntries(teams.map((t) => [t.id, t.purse])));
  }, [teams]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const startPollingRoom = useCallback(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/auction/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ division })
        });
        if (res.ok) {
          router.refresh();
        }
      } catch {
        /* ignore poll errors */
      }
    }, 2000);
  }, [division, router]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const runBatch = useCallback(async (position: PlayerCategory) => {
    setActiveBatch(position);
    setPlayerIndex(0);
    setCurrentPlayer(null);
    setMessage(null);
    setAutoAdvancing(false);

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
        startPollingRoom();
      } else {
        setMessage(payload.message || 'Failed to start player.');
      }
    } catch {
      setMessage('Could not start the auction lot.');
    } finally {
      setIsStarting(false);
    }
  }, [room.id, startPollingRoom]);

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
        stopPolling();

        if (outcome === 'sold') {
          const bidEl = document.getElementById('current-bid-display');
          const finalBid = bidEl ? Number(bidEl.textContent?.replace(/[^0-9]/g, '') || '0') : currentPlayer.base_price;
          setCurrentPlayer(null);
          setPlayerIndex((prev) => prev + 1);
          setAutoAdvancing(true);

          const batchSize = batchPlayers.length;
          const nextIndex = playerIndex + 1;

          if (nextIndex < batchSize) {
            setMessage(`Sold! Starting next ${formatCategory(currentPlayer.category)}...`);
            await new Promise((r) => setTimeout(r, 1500));
            await startPlayer(batchPlayers[nextIndex]);
            setPlayerIndex(nextIndex);
          } else {
            setMessage('Batch complete! All players in this position have been auctioned.');
            setActiveBatch(null);
          }
        } else {
          setCurrentPlayer(null);
          setPlayerIndex((prev) => prev + 1);
          setAutoAdvancing(true);

          const nextIndex = playerIndex + 1;
          if (nextIndex < batchPlayers.length) {
            setMessage(`Marked unsold. Starting next ${formatCategory(currentPlayer.category)}...`);
            await new Promise((r) => setTimeout(r, 1500));
            await startPlayer(batchPlayers[nextIndex]);
            setPlayerIndex(nextIndex);
          } else {
            setMessage('Batch complete! All players in this position have been auctioned.');
            setActiveBatch(null);
          }
        }
      } else {
        setMessage(payload.message || 'Failed to close lot.');
      }
    } catch {
      setMessage('Could not close the auction lot.');
    } finally {
      setIsClosing(false);
      setAutoAdvancing(false);
    }
  }, [currentPlayer, room.id, playerIndex, batchPlayers, startPlayer, stopPolling]);

  const inProgress = activeBatch !== null && !isBatchComplete;

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
              onClick={() => {
                if (!inProgress) runBatch(key);
              }}
              disabled={inProgress || count === 0}
              className="group relative flex items-center gap-3 rounded-2xl border-2 px-6 py-4 text-left transition disabled:opacity-40"
              style={{
                borderColor: isActive ? '#f5c542' : '#e5e7eb',
                backgroundColor: isActive ? '#fffbeb' : '#ffffff',
                boxShadow: isActive ? '0 4px 12px rgba(245, 197, 66, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition`}
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
                    <Play className="h-4 w-4" />
                    Run this batch
                  </span>
                </div>
              )}

              {isActive && (
                <div className="ml-auto">
                  {isBatchComplete ? (
                    <span className="rounded-full bg-lime/20 px-3 py-1 text-xs font-bold text-lime">Done</span>
                  ) : (
                    <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold">
                      {playerIndex + 1}/{batchPlayers.length}
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
        <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-lg font-bold text-gray-500">Starting player...</p>
        </div>
      )}

      {currentPlayer && !isStarting && !isClosing && (
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="badge mb-2 border-gray-300 text-gray-500">{formatCategory(currentPlayer.category)}</p>
              <h2 className="text-3xl font-black text-gray-900">{currentPlayer.name}</h2>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Banknote className="h-4 w-4" />
                  Base: ${currency(currentPlayer.base_price)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Current bid</p>
              <p id="current-bid-display" className="mt-1 text-4xl font-black text-gold drop-shadow-sm">
                ${currency(room.current_bid)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <button
              disabled={isClosing}
              onClick={() => closeLot('unsold')}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-300 px-5 py-4 font-bold text-gray-600 transition hover:border-red-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
            >
              <X className="h-5 w-5" />
              Mark unsold
            </button>
            <button
              disabled={isClosing || !room.current_highest_team_id}
              onClick={() => closeLot('sold')}
              className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lime to-cyan px-5 py-4 font-black text-white shadow transition hover:from-gray-800 hover:to-gray-800 disabled:opacity-40"
            >
              {isClosing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              Sell to highest bidder
            </button>
          </div>
        </div>
      )}

      {activeBatch && !currentPlayer && !isStarting && !isBatchComplete && !isClosing && (
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-16">
          <div className="text-center">
            <Play className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-lg font-bold text-gray-400">
              Ready to start — player at index {playerIndex}
            </p>
            <button
              onClick={() => startPlayer(batchPlayers[playerIndex])}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 font-bold text-white shadow transition hover:bg-gold/90"
            >
              <Gavel className="h-4 w-4" />
              Start this player
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

      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-black uppercase tracking-[0.1em] text-gray-900">Teams in this auction</h3>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {teams.map((team) => {
            const currentPurse = teamPurses[team.id] ?? team.purse;
            return (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-gray-900">{team.name}</p>
                  <p className="text-xs text-gray-400">
                    <Banknote className="mr-0.5 inline h-3 w-3" />
                    ${currency(currentPurse)}
                  </p>
                </div>
                <span className="rounded-full bg-lime/15 px-2.5 py-0.5 text-xs font-bold text-lime">Joined</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
