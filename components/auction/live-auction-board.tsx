'use client';

import { useEffect, useMemo, useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Gavel, Hourglass, ShoppingBag } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { currency } from '@/lib/utils';
import type { AuctionRoom, Bid, Player, Team, UserRole, Purchase } from '@/lib/types';

interface TeamPurchaseDisplay {
  playerName: string;
  price: number;
}

const INCREMENTS = [10, 20, 50, 100, 500, 1000];

interface LiveAuctionBoardProps {
  divisionLabel: string;
  viewerRole: UserRole;
  viewerTeamId?: string | null;
  room: AuctionRoom;
  currentPlayer: Player | null;
  teams: Team[];
  recentBids: Bid[];
  teamSlug?: string;
  purchases?: TeamPurchaseDisplay[];
  teamPurse?: number;
  roomId?: string;
}

function PurchasesSection({ purchases, teamPurse }: { purchases: TeamPurchaseDisplay[]; teamPurse?: number }) {
  const [open, setOpen] = useState(false);
  const spent = useMemo(() => purchases.reduce((sum, p) => sum + p.price, 0), [purchases]);
  const remaining = teamPurse ?? 0;

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-black/60 shadow-lg backdrop-blur-xl">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-5 w-5 text-white/70" />
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-white">My purchases</p>
            <p className="mt-1 text-lg font-black text-white">{purchases.length} player{purchases.length !== 1 ? 's' : ''} bought</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-white">Spent</p>
            <p className="font-bold text-white">${currency(spent)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white">Remaining</p>
            <p className={`font-bold ${remaining > 0 ? 'text-gold' : 'text-red-400'}`}>${currency(remaining)}</p>
          </div>
          {open ? <ChevronUp className="h-5 w-5 text-white/40" /> : <ChevronDown className="h-5 w-5 text-white/40" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-white/10 px-6 py-4">
          {purchases.length === 0 ? (
            <p className="text-sm text-white/40">No players purchased yet.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-3 font-bold text-white/50">#</th>
                    <th className="px-4 py-3 font-bold text-white/50">Player</th>
                    <th className="px-4 py-3 font-bold text-white/50 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3 text-white/40">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-white">{p.playerName}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber">${currency(p.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LiveAuctionBoard({ divisionLabel, viewerRole, viewerTeamId, room, currentPlayer, teams, recentBids, teamSlug, purchases: initialPurchases, teamPurse, roomId }: LiveAuctionBoardProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [ended, setEnded] = useState(false);
  const [selectedIncrement, setSelectedIncrement] = useState<number | null>(null);

  const [liveRoom, setLiveRoom] = useState(room);
  const [livePlayer, setLivePlayer] = useState<Player | null>(currentPlayer);
  const [livePurchases, setLivePurchases] = useState<TeamPurchaseDisplay[]>(initialPurchases ?? []);
  const [livePurse, setLivePurse] = useState(teamPurse ?? 0);
  const [notification, setNotification] = useState<{
    type: 'sold' | 'unsold';
    playerName: string;
    teamName?: string;
    price?: number;
  } | null>(null);

  const playerRef = useRef(livePlayer);
  playerRef.current = livePlayer;

  useEffect(() => {
    setLivePurchases(initialPurchases ?? []);
  }, [initialPurchases]);

  useEffect(() => {
    setLivePurse(teamPurse ?? 0);
  }, [teamPurse]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let mounted = true;

    if (roomId) {
      const channel = supabase
        .channel(`team-data-${roomId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'purchases', filter: `room_id=eq.${roomId}` }, async (payload) => {
          if (!mounted) return;
          const p = payload.new as Purchase;
          if (p.team_id !== viewerTeamId) return;
          const { data: player } = await supabase.from('players').select('name').eq('id', p.player_id).single<{ name: string }>();
          setLivePurchases((prev) => [...prev, { playerName: player?.name ?? 'Unknown', price: p.price }]);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams', filter: `id=eq.${viewerTeamId}` }, (payload) => {
          if (!mounted) return;
          const updated = payload.new as Team;
          setLivePurse(updated.purse);
        })
        .subscribe();

      return () => {
        mounted = false;
        supabase.removeChannel(channel);
      };
    }
  }, [roomId, viewerTeamId]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let mounted = true;

    async function fetchPlayer(playerId: string | null) {
      if (!playerId) {
        if (mounted) setLivePlayer(null);
        return;
      }
      const { data } = await supabase.from('players').select('*').eq('id', playerId).single();
      if (data && mounted) setLivePlayer(data as Player);
    }

    const channel = supabase
      .channel(`team-auction-live-${room.division}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_rooms', filter: `division=eq.${room.division}` }, (payload) => {
        const updated = payload.new as AuctionRoom;
        if (!mounted) return;
        setLiveRoom(updated);
        if (updated.ended_at) setEnded(true);
        if (updated.current_player_id && updated.current_player_id !== playerRef.current?.id) {
          setNotification(null);
          setMessage(null);
          fetchPlayer(updated.current_player_id);
        } else if (!updated.current_player_id && updated.current_player_id !== playerRef.current?.id) {
          fetchPlayer(null);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `division=eq.${room.division}` }, (payload) => {
        const updated = payload.new as Player;
        if (!mounted) return;
        setLivePlayer((prev) => (prev?.id === updated.id ? updated : prev));
      })
      .subscribe();

    const broadcastChannel = supabase
      .channel(`broadcast-${room.division}`)
      .on('broadcast', { event: 'close-outcome' }, (payload) => {
        if (!mounted) return;
        setNotification(payload.payload);
        setMessage(null);
      })
      .subscribe();

    fetchPlayer(room.current_player_id);

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [room.division, room.current_player_id]);

  const highestBidder = useMemo(() => {
    if (!liveRoom.current_highest_team_id) return null;
    return teams.find((t) => t.id === liveRoom.current_highest_team_id) ?? null;
  }, [liveRoom.current_highest_team_id, teams]);

  const canBid = viewerRole === 'team' && viewerTeamId && liveRoom.status === 'live' && livePlayer;
  const isLeading = liveRoom.current_highest_team_id === viewerTeamId;

  const remaining = livePurse;
  const spent = useMemo(() => livePurchases.reduce((sum, p) => sum + p.price, 0), [livePurchases]);

  async function placeBid(increment: number) {
    if (!canBid) return;
    setMessage(null);
    setSelectedIncrement(null);

    const newBid = Number(liveRoom.current_bid) + increment;
    const prevRoom = liveRoom;
    setLiveRoom({ ...liveRoom, current_bid: newBid, current_highest_team_id: viewerTeamId! });

    startTransition(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 400));
        try {
          const response = await fetch('/api/bid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: liveRoom.id, increment })
          });
          const payload = await response.json();
          if (response.ok) {
            setMessage(payload.message);
            return;
          }
          if (response.status === 409 && attempt < 2) continue;
          setLiveRoom(prevRoom);
          setMessage(payload.message ?? 'Unable to place bid.');
          return;
        } catch {
          if (attempt < 2) continue;
          setLiveRoom(prevRoom);
          setMessage('Unable to place bid.');
          return;
        }
      }
    });
  }

  function handlePlaceBid() {
    if (selectedIncrement === null) return;
    placeBid(selectedIncrement);
  }

  if (ended) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <div className="rounded-2xl border border-white/20 bg-black/60 p-12 text-center shadow-lg backdrop-blur-xl">
          <p className="text-4xl font-black uppercase tracking-[0.12em] text-white">Auction has ended</p>
          <p className="mt-3 text-sm text-white/40">Thank you for participating in The Genesis auction.</p>
          {teamSlug ? (
            <Link href={`/teams/${teamSlug}`} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cyan px-8 py-3.5 font-bold text-black transition hover:bg-cyan/90">
              Return to team home
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  if (notification) {
    return (
      <div className="flex flex-col items-center gap-8 py-20">
        <div className="w-full max-w-2xl rounded-2xl border-2 p-10 text-center shadow-lg backdrop-blur-xl bg-black/60" style={{ borderColor: '#F4C542' }}>
          <p className="text-4xl font-black uppercase tracking-[0.08em]" style={{ color: '#F4C542' }}>{notification.playerName}</p>
          <p className="mt-4 text-2xl font-bold tracking-[0.04em] text-white/90">
            {notification.type === 'sold' ? (
              <><span className="text-white/80">is sold to </span><span className="font-black" style={{ color: '#F4C542' }}>{notification.teamName}</span><span className="text-white/80"> for </span><span className="font-black" style={{ color: '#F4C542' }}>${currency(notification.price!)}</span></>
            ) : (
              <span style={{ color: '#F4C542' }}>is unsold</span>
            )}
          </p>
          <p className="mt-6 text-sm text-white/60">Next player starting soon...</p>
        </div>
        <PurchasesSection purchases={livePurchases} teamPurse={livePurse} />
      </div>
    );
  }

  if (!livePlayer) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8">
        <div className="w-full rounded-2xl border border-white/20 bg-black/60 p-12 text-center shadow-lg backdrop-blur-xl">
          <Hourglass className="mx-auto h-16 w-16 text-white/60" />
          <p className="mt-6 text-2xl font-black uppercase tracking-[0.12em] text-white">Auction will start soon</p>
          <p className="mt-2 text-sm text-white/60">Wait for the auctioneer to begin.</p>
        </div>
        <PurchasesSection purchases={livePurchases} teamPurse={livePurse} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-10">
      <div className="flex items-center gap-20">
        <div className="w-[24rem] animate-slide-from-left">
          {livePlayer.card_image_url ? (
            <Image
              src={livePlayer.card_image_url}
              alt={livePlayer.name}
              width={600}
              height={750}
              sizes="(max-width: 768px) 100vw, 24rem"
              className="aspect-[4/5] w-full rounded-xl object-cover shadow-[0_8px_30px_rgb(0,0,0,0.35)]"
              priority
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl bg-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
              <Gavel className="h-28 w-28 text-white/20" />
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-xl font-bold uppercase tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" style={{ color: '#BF2816' }}>Current price</p>
          <p className="mt-3 text-8xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-all" style={{ color: '#BF2816' }}>
            ${currency(liveRoom.current_bid || livePlayer.base_price)}
          </p>
          <p className="mt-12 text-7xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" style={{ color: '#F4C542' }}>
            {highestBidder ? highestBidder.name : 'No bids'}
          </p>
          <p className="mt-2 text-xl font-bold uppercase tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" style={{ color: '#F4C542' }}>Highest bidder</p>
        </div>
      </div>

      {!liveRoom.current_highest_team_id ? (
        <button
          onClick={() => placeBid(0)}
          disabled={!canBid || isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#BF2816] px-10 py-4 font-black text-white shadow-lg transition hover:ring-2 hover:ring-gold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Gavel className="h-5 w-5" />
          Place First Bid
        </button>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {INCREMENTS.filter((inc) => !(inc <= 20 && Number(liveRoom.current_bid) >= 100)).map((inc) => {
              const isSelected = selectedIncrement === inc;
              const isDisabled = !canBid || isPending || isLeading;
              const bidAmount = Number(liveRoom.current_bid) + inc;
              const exceedsPurse = bidAmount > remaining;
              return (
                <button
                  key={inc}
                  onClick={() => {
                    if (isDisabled || exceedsPurse) return;
                    setSelectedIncrement(isSelected ? null : inc);
                  }}
                  disabled={isDisabled || exceedsPurse}
                  className={`flex items-center gap-2 rounded-xl border-2 px-6 py-3 font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${
                    isSelected
                      ? 'border-gold bg-blue-600 hover:bg-blue-700'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
                  }`}
                >
                  +${inc}
                </button>
              );
            })}
          </div>

          {isLeading ? (
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-5 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-xl">
              <Gavel className="h-4 w-4 text-gold" /> You are the highest bidder
            </p>
          ) : selectedIncrement !== null && !isPending ? (
            <button
              onClick={handlePlaceBid}
              className="inline-flex items-center gap-2 rounded-xl bg-[#BF2816] px-10 py-4 font-black text-white shadow-lg transition hover:ring-2 hover:ring-gold"
            >
              <Gavel className="h-5 w-5" />
              Place Bid
            </button>
          ) : null}
        </>
      )}

      {isPending && (
        <p className="text-sm font-semibold text-white/70">Placing bid...</p>
      )}

      

      <PurchasesSection purchases={livePurchases} teamPurse={livePurse} />
    </div>
  );
}
