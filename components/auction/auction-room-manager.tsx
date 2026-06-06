'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Play, Loader2, Shield, Sparkles, Target, Trophy,
  Gavel, X, Check, Users, ArrowLeft, Eye, OctagonX
} from 'lucide-react';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { currency, formatCategory } from '@/lib/utils';
import type { AuctionRoom, Bid, Player, Team, PlayerCategory, Purchase } from '@/lib/types';

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
  purchases: Purchase[];
  teams: Team[];
  initialBids?: Bid[];
}

export function AuctionRoomManager({ division, room: initialRoom, players, purchases: initialPurchases, teams, initialBids = [] }: AuctionRoomManagerProps) {
  const router = useRouter();

  const [room, setRoom] = useState(initialRoom);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [activeBatch, setActiveBatch] = useState<PlayerCategory | null>(null);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(() => {
    if (initialRoom.current_player_id) {
      return players.find((p) => p.id === initialRoom.current_player_id) ?? null;
    }
    return null;
  });
  const [batchQueue, setBatchQueue] = useState<Player[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [managersOpen, setManagersOpen] = useState(false);
  const [bids, setBids] = useState<Bid[]>(initialBids);
  const [notification, setNotification] = useState<{
    type: 'sold' | 'unsold';
    playerName: string;
    teamName?: string;
    price?: number;
  } | null>(null);

  const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationChannelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabase>['channel']> | null>(null);
  const playerIndexRef = useRef(playerIndex);
  playerIndexRef.current = playerIndex;
  const batchQueueRef = useRef(batchQueue);
  batchQueueRef.current = batchQueue;

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  const isBatchComplete = useMemo(() => {
    if (activeBatch === null) return false;
    return playerIndex >= batchQueue.length && batchQueue.length > 0;
  }, [activeBatch, playerIndex, batchQueue]);

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

  const bidCount = room.current_bid || (currentPlayer?.base_price ?? 0);

  const roomPlayerRef = useRef(initialRoom.current_player_id);
  roomPlayerRef.current = room.current_player_id;

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`auction-room-${room.division}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_rooms', filter: `division=eq.${room.division}` }, (payload) => {
        const updated = payload.new as AuctionRoom;
        setRoom(updated);
        if (updated.current_player_id && updated.current_player_id !== roomPlayerRef.current) {
          setBids([]);
          setNotification(null);
          setMessage(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.division]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`purchases-${division}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases', filter: `room_id=eq.${initialRoom.id}` }, (payload) => {
        const newPurchase = payload.new as Purchase;
        if (payload.eventType === 'INSERT') {
          setPurchases((prev) => [...prev, newPurchase]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [division, initialRoom.id]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`bids-${initialRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids', filter: `room_id=eq.${initialRoom.id}` }, (payload) => {
        const newBid = payload.new as Bid;
        setBids((prev) => {
          if (prev.some((b) => b.id === newBid.id)) return prev;
          return [newBid, ...prev];
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bids', filter: `room_id=eq.${initialRoom.id}` }, (payload) => {
        const deleted = payload.old as Bid;
        setBids((prev) => prev.filter((b) => b.id !== deleted.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [initialRoom.id]);

  const broadcastOutcome = useCallback(async (outcome: 'sold' | 'unsold', playerName: string, teamName?: string, price?: number) => {
    const supabase = createBrowserSupabase();
    const ch = supabase.channel(`broadcast-${division}`);
    notificationChannelRef.current = ch;
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        ch.send({
          type: 'broadcast',
          event: 'close-outcome',
          payload: { type: outcome, playerName, teamName, price }
        });
      }
    });
  }, [division]);

  const runBatch = useCallback(async (position: PlayerCategory) => {
    setActiveBatch(position);
    setPlayerIndex(0);
    setCurrentPlayer(null);
    setMessage(null);
    setNotification(null);

    const positionPlayers = players.filter((p) => p.category === position);
    if (positionPlayers.length === 0) {
      setMessage(`No available ${formatCategory(position)}s.`);
      return;
    }

    setBatchQueue(positionPlayers);
    await startPlayer(positionPlayers[0]);
  }, [players]);

  const startPlayer = useCallback(async (player: Player) => {
    setIsStarting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/auction/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: initialRoom.id, playerId: player.id })
      });
      const payload = await res.json();
      if (res.ok) {
        setCurrentPlayer(player);
      } else {
        if (payload.message?.toLowerCase().includes('not available')) {
          setMessage(`${player.name} is no longer available. Skipping...`);
          await new Promise((r) => setTimeout(r, 1500));
          const q = batchQueueRef.current;
          const idx = playerIndexRef.current;
          const nextIndex = idx + 1;
          if (nextIndex < q.length) {
            setPlayerIndex(nextIndex);
            await startPlayer(q[nextIndex]);
          } else {
            setActiveBatch(null);
            setPlayerIndex(0);
            setBatchQueue([]);
            setMessage('All remaining players in this batch were already taken. Batch complete.');
          }
        } else {
          setMessage(payload.message || 'Failed to start player.');
        }
      }
    } catch {
      setMessage('Could not start the auction lot.');
    } finally {
      setIsStarting(false);
    }
  }, [initialRoom.id]);

  const closeLot = useCallback(async (outcome: 'sold' | 'unsold') => {
    if (!currentPlayer) return;
    setIsClosing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/auction/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: initialRoom.id, outcome })
      });
      const payload = await res.json();
      if (res.ok) {
        const playerName = currentPlayer.name;
        const teamName = outcome === 'sold' ? highestBidder?.name : undefined;
        const price = outcome === 'sold' ? room.current_bid : undefined;

        setNotification({ type: outcome, playerName, teamName, price });
        setCurrentPlayer(null);
        broadcastOutcome(outcome, playerName, teamName, price);

        if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = setTimeout(async () => {
          setNotification(null);
          const q = batchQueueRef.current;
          const idx = playerIndexRef.current;
          const nextIndex = idx + 1;
          if (nextIndex < q.length) {
            setPlayerIndex(nextIndex);
            await startPlayer(q[nextIndex]);
          } else {
            setActiveBatch(null);
            setPlayerIndex(0);
            setBatchQueue([]);
          }
        }, 7000);
      } else {
        setMessage(payload.message || 'Failed to close lot.');
      }
    } catch {
      setMessage('Could not close the auction lot.');
    } finally {
      setIsClosing(false);
    }
  }, [currentPlayer, initialRoom.id, room.current_bid, room.current_highest_team_id, highestBidder, broadcastOutcome, startPlayer]);

  const endAuction = useCallback(async () => {
    if (!confirm('End auction and clear all purchases? This cannot be undone.')) return;
    setIsEnding(true);
    try {
      const res = await fetch('/api/admin/auction/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ division })
      });
      const payload = await res.json();
      if (res.ok) {
        setPurchases([]);
        setCurrentPlayer(null);
        setActiveBatch(null);
        setPlayerIndex(0);
        window.location.href = '/admin';
      } else {
        setMessage(payload.message || 'Failed to end auction.');
      }
    } catch {
      setMessage('Could not end auction.');
    } finally {
      setIsEnding(false);
    }
  }, [division, router]);

  const inProgress = activeBatch !== null && !isBatchComplete && currentPlayer !== null;

  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [liveTeams, setLiveTeams] = useState(teams);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`admin-teams-${division}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams', filter: `division=eq.${division}` }, (payload) => {
        const updated = payload.new as Team;
        setLiveTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [division]);

  const teamPurses = useMemo(() => {
    const map: Record<string, number> = {};
    for (const team of liveTeams) map[team.id] = team.purse;
    return map;
  }, [liveTeams]);

  const teamSpent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const team of liveTeams) {
      map[team.id] = purchases.filter((p) => p.team_id === team.id).reduce((sum, p) => sum + p.price, 0);
    }
    return map;
  }, [liveTeams, purchases]);

  const teamPurchasesMap = useMemo(() => {
    const map: Record<string, Purchase[]> = {};
    for (const team of liveTeams) map[team.id] = purchases.filter((p) => p.team_id === team.id);
    return map;
  }, [liveTeams, purchases]);

  const maxPurchases = useMemo(() => {
    return Math.max(14, ...liveTeams.map((t) => teamPurchasesMap[t.id]?.length ?? 0));
  }, [liveTeams, teamPurchasesMap]);

  const getPlayerById = useCallback((id: string) => {
    return players.find((p) => p.id === id) ?? null;
  }, [players]);

  useEffect(() => {
    const supabase = createBrowserSupabase();

    async function fetchConnections() {
      const { data } = await supabase.from('auction_participants').select('team_id, connected').eq('room_id', initialRoom.id);
      if (data) {
        const map: Record<string, boolean> = {};
        for (const p of data) map[p.team_id] = p.connected;
        setConnections(map);
      }
    }
    fetchConnections();

    const channel = supabase
      .channel(`participants-${initialRoom.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_participants', filter: `room_id=eq.${initialRoom.id}` }, (payload) => {
        const row = payload.new as { team_id: string; connected: boolean } | null;
        if (row) setConnections((prev) => ({ ...prev, [row.team_id]: row.connected }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [initialRoom.id]);

  const displayBid = room.current_bid || (currentPlayer?.base_price ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to admin
        </Link>
        <Link href="/">
          <Image src="/Genesislogo.png" alt="The Genesis" width={220} height={60} className="h-14 w-auto" priority />
        </Link>
        <div className="flex items-center gap-3">
          {activeBatch && (
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Active batch</p>
              <p className="text-base font-black text-gray-900">{formatCategory(activeBatch)}</p>
            </div>
          )}
          {room.join_code ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Join code</p>
              <p className="mt-0.5 text-lg font-black tracking-[0.25em] text-cyan">{room.join_code}</p>
            </div>
          ) : null}
          <button
            onClick={endAuction}
            disabled={isEnding}
            className="flex items-center gap-2 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-2 font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-40"
          >
            {isEnding ? <Loader2 className="h-4 w-4 animate-spin" /> : <OctagonX className="h-4 w-4" />}
            End
          </button>
        </div>
      </div>

      <h1 className="text-lg font-black uppercase tracking-[0.08em] text-gray-900">
        {division === 'men' ? 'Male Futsal' : 'Female Futsal'} Auction
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        {POSITIONS.map(({ key, label, Icon }) => {
          const count = batchedCounts[key];
          const isActive = activeBatch === key;
          return (
            <button
              key={key}
              onClick={() => { if (!inProgress) runBatch(key); }}
              disabled={inProgress || count === 0}
              className="group relative flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-left transition disabled:opacity-40"
              style={{
                borderColor: isActive ? '#f5c542' : '#e5e7eb',
                backgroundColor: isActive ? '#fffbeb' : '#ffffff',
                boxShadow: isActive ? '0 4px 12px rgba(245, 197, 66, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              {isActive && !isBatchComplete && currentPlayer ? (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-lime" />
                </span>
              ) : null}
              <div className="flex h-9 w-9 items-center justify-center rounded-lg transition" style={{ backgroundColor: isActive ? '#f5c542' : '#f3f4f6' }}>
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.08em] ${isActive ? 'text-gold' : 'text-gray-900'}`}>{label}</p>
                <p className="text-xs text-gray-900">{count} players</p>
              </div>
              {!inProgress && count > 0 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                    <Play className="h-3 w-3" /> Run
                  </span>
                </div>
              )}
              {isActive && (
                <div className="ml-auto">
                  {isBatchComplete ? (
                    <span className="rounded-full bg-lime/20 px-2 py-0.5 text-[10px] font-bold text-lime">Done</span>
                  ) : (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">
                      {Math.min(playerIndex + 1, batchQueue.length)}/{batchQueue.length}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setManagersOpen(true)}
          className="ml-auto flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 shadow-sm transition hover:border-gold hover:shadow-md"
        >
          <Eye className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-900">Managers</span>
          <span className="text-xs text-gray-400">{teams.length} teams</span>
        </button>
      </div>

      {message && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700">{message}</div>
      )}

      {notification ? (
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-20">
          <div className={`rounded-2xl border-2 p-10 text-center shadow-lg ${notification.type === 'sold' ? 'border-lime bg-lime/5' : 'border-orange bg-orange/5'}`}>
            <p className="text-3xl font-black uppercase tracking-[0.08em] text-gray-900">{notification.playerName}</p>
            <p className="mt-4 text-xl font-bold text-gray-600">
              {notification.type === 'sold' ? (
                <><span className="text-gray-900">is sold to </span><span className="text-lime">{notification.teamName}</span><span className="text-gray-900"> for </span><span className="text-gold">${currency(notification.price!)}</span></>
              ) : (
                <span className="text-orange">is unsold</span>
              )}
            </p>
            <p className="mt-6 text-sm text-gray-400">Next player starting soon...</p>
          </div>
        </div>
      ) : isStarting ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-lg font-bold text-gray-500">Starting player...</p>
        </div>
      ) : currentPlayer && (
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10">
          <div className="flex items-center gap-20">
            <div className="w-[30rem] animate-slide-from-left">
              {currentPlayer.card_image_url ? (
                <Image
                  src={currentPlayer.card_image_url}
                  alt={currentPlayer.name}
                  width={600}
                  height={750}
                  sizes="(max-width: 768px) 100vw, 30rem"
                  className="aspect-[4/5] w-full rounded-xl object-cover shadow-[0_8px_30px_rgb(0,0,0,0.35)]"
                  priority
                />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
                  <Shield className="h-28 w-28 text-gray-300" />
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-lg font-bold uppercase tracking-[0.2em]" style={{ color: '#264153' }}>Current price</p>
              <p id="current-bid-display" className="mt-3 text-7xl font-black drop-shadow-sm transition-all" style={{ color: '#264153' }}>
                ${currency(room.current_bid || currentPlayer.base_price)}
              </p>
              <p className="mt-10 text-4xl font-black" style={{ color: '#b6360b' }}>{currentPlayer.name}</p>
              <p className="mt-3 text-lg font-bold uppercase tracking-[0.08em]" style={{ color: '#264153' }}>
                {formatCategory(currentPlayer.category)}
              </p>
              <p className="mt-8 text-6xl font-black drop-shadow-sm" style={{ color: '#264153' }}>
                {highestBidder ? highestBidder.name : 'No bids'}
              </p>
              <p className="mt-1 text-base font-bold uppercase tracking-[0.2em]" style={{ color: '#264153' }}>Highest bidder</p>
            </div>
          </div>
          <div className="flex gap-5">
            <button
              disabled={isClosing}
              onClick={() => closeLot('unsold')}
              className="flex items-center gap-2 rounded-xl bg-[#1D3C50] px-8 py-3.5 font-bold text-white shadow transition hover:ring-2 hover:ring-gold disabled:opacity-40"
            >
              {isClosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Mark Unsold
            </button>
            <button
              disabled={isClosing || !room.current_highest_team_id}
              onClick={() => closeLot('sold')}
              className="flex items-center gap-2 rounded-xl bg-[#BF2816] px-8 py-3.5 font-black text-white shadow transition hover:ring-2 hover:ring-gold disabled:opacity-40"
            >
              {isClosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Mark Sold
            </button>
          </div>
          <BidHistoryPanel
            bids={bids}
            teams={liveTeams}
            room={room}
            currentPlayer={currentPlayer}
            initialRoomId={initialRoom.id}
          />
        </div>
      )}

      {activeBatch && !currentPlayer && !isStarting && !isBatchComplete && !notification && (
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-10">
          <div className="text-center">
            <Play className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-base font-bold text-gray-400">Ready to start</p>
            <button
              onClick={() => startPlayer(batchQueue[playerIndex])}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-bold text-white shadow transition hover:bg-gold/90"
            >
              <Gavel className="h-4 w-4" /> Start this player
            </button>
          </div>
        </div>
      )}

      {managersOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-gray-900" />
              <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-gray-900">Managers</h2>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 py-6">
            <div className="mb-3">
              <button
                onClick={() => setManagersOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-500 transition hover:border-red-400 hover:bg-red-50"
              >
                <X className="size-3.5" /> Close
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border-2 border-gray-200">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="w-32 px-4 py-3 font-bold uppercase tracking-[0.1em] text-gray-500"></th>
                      {liveTeams.map((team) => (
                        <th key={team.id} className="min-w-[140px] px-4 py-3 font-bold uppercase tracking-[0.08em] text-gray-700">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block size-2.5 rounded-full ${connections[team.id] ? 'bg-green-500' : 'bg-red-400'}`} />
                            {team.name}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <td className="px-4 py-3 font-bold text-gray-500">Spent</td>
                      {liveTeams.map((team) => (
                        <td key={team.id} className="px-4 py-3 font-bold text-orange-600">
                          ${currency(teamSpent[team.id] ?? 0)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b-2 border-gray-200 bg-gray-50/50">
                      <td className="px-4 py-3 font-bold text-gray-500">Remaining</td>
                      {liveTeams.map((team) => {
                        const remaining = teamPurses[team.id] ?? team.purse;
                        return (
                          <td key={team.id} className="px-4 py-3">
                            <span className={`font-bold ${remaining > 0 ? 'text-lime-600' : 'text-red-500'}`}>
                              ${currency(remaining)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    {Array.from({ length: maxPurchases }).map((_, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-2.5 text-gray-400">
                          {rowIndex < Math.max(...liveTeams.map((t) => teamPurchasesMap[t.id]?.length ?? 0)) ? `#${rowIndex + 1}` : ''}
                        </td>
                        {liveTeams.map((team) => {
                          const tp = teamPurchasesMap[team.id] ?? [];
                          const purchase = tp[rowIndex];
                          if (!purchase) return <td key={team.id} className="px-4 py-2.5 text-gray-300">—</td>;
                          const player = getPlayerById(purchase.player_id);
                          return (
                            <td key={team.id} className="px-4 py-2.5">
                              <span className="font-semibold text-gray-800">{player?.name ?? 'Unknown'}</span>
                              <span className="ml-2 font-bold text-gold">${currency(purchase.price)}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BidHistoryPanel({
  bids, teams, room, currentPlayer, initialRoomId
}: {
  bids: Bid[];
  teams: Team[];
  room: AuctionRoom;
  currentPlayer: Player | null;
  initialRoomId: string;
}) {
  const [isResetting, setIsResetting] = useState(false);

  const playerBids = useMemo(() => {
    if (!room.current_player_id) return [];
    return bids.filter((b) => b.player_id === room.current_player_id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [bids, room.current_player_id]);

  async function handleResetBid() {
    if (!confirm('Reset the most recent bid? This will remove the latest bid and restore the previous state.')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/auction/reset-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: initialRoomId })
      });
      const payload = await res.json();
      if (!res.ok) {
        alert(payload.message ?? 'Failed to reset bid.');
      }
    } catch {
      alert('Could not reset bid.');
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-white">Bid History</h3>
        {playerBids.length > 0 && (
          <button
            onClick={handleResetBid}
            disabled={isResetting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D3C50] px-3 py-1.5 text-xs font-bold text-white transition hover:ring-2 hover:ring-gold disabled:opacity-40"
          >
            {isResetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            Reset Recent Bid
          </button>
        )}
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-white/20 bg-black/60 shadow-lg backdrop-blur-xl">
        {playerBids.length === 0 ? (
          <div className="px-4 py-3 text-sm text-white/60">No bids yet for this lot.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/40">
                <th className="px-4 py-2.5 font-bold text-white">Team</th>
                <th className="px-4 py-2.5 text-right font-bold text-white">Amount</th>
              </tr>
            </thead>
            <tbody>
              {playerBids.slice(0, 10).map((bid) => {
                const team = teams.find((t) => t.id === bid.team_id);
                const isHighest = bid.team_id === room.current_highest_team_id;
                return (
                  <tr key={bid.id} className="border-b border-white/10 last:border-0">
                    <td className={`px-4 py-2.5 ${isHighest ? 'font-bold text-gold' : 'text-white'}`}>
                      {team?.name ?? 'Unknown'}
                      {isHighest ? ' (highest)' : ''}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-bold ${isHighest ? 'text-gold' : 'text-white'}`}>
                      ${currency(bid.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {!room.current_player_id && (
        <p className="mt-2 text-xs text-white/60">Waiting for a player to be nominated...</p>
      )}
    </div>
  );
}
