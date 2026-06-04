'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Gavel, Hourglass, Loader2, ShoppingBag } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { currency, formatCategory } from '@/lib/utils';
import type { AuctionRoom, Bid, Player, Team, UserRole } from '@/lib/types';

interface TeamPurchaseDisplay {
  playerName: string;
  price: number;
}

const INCREMENTS = [50, 100, 500, 1000];

interface LiveAuctionBoardProps {
  divisionLabel: string;
  viewerRole: UserRole;
  viewerTeamId?: string | null;
  room: AuctionRoom;
  currentPlayer: Player | null;
  teams: Team[];
  recentBids: Bid[];
  purchases?: TeamPurchaseDisplay[];
  teamPurse?: number;
}

function PurchasesSection({ purchases, teamPurse }: { purchases: TeamPurchaseDisplay[]; teamPurse?: number }) {
  const [open, setOpen] = useState(false);
  const spent = useMemo(() => purchases.reduce((sum, p) => sum + p.price, 0), [purchases]);
  const remaining = teamPurse ?? 0;

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-5 w-5 text-white/40" />
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-white/50">My purchases</p>
            <p className="mt-1 text-lg font-black text-white">{purchases.length} player{purchases.length !== 1 ? 's' : ''} bought</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-white/40">Spent</p>
            <p className="font-bold text-orange-400">${currency(spent)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">Remaining</p>
            <p className={`font-bold ${remaining > 0 ? 'text-lime' : 'text-red-400'}`}>${currency(remaining)}</p>
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

export function LiveAuctionBoard({ divisionLabel, viewerRole, viewerTeamId, room, currentPlayer, teams, recentBids, purchases, teamPurse }: LiveAuctionBoardProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [liveRoom, setLiveRoom] = useState(room);

  useEffect(() => {
    const supabase = createBrowserSupabase();

    const channel = supabase
      .channel(`team-auction-${room.division}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_rooms', filter: `division=eq.${room.division}` }, (payload) => {
        const updated = payload.new as AuctionRoom;
        setLiveRoom(updated);
        if (updated.current_player_id !== room.current_player_id) {
          window.location.reload();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `division=eq.${room.division}` }, () => {
        window.location.reload();
      })
      .subscribe();

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('auction_rooms')
        .select('*')
        .eq('division', room.division)
        .single();
      if (data) setLiveRoom(data as AuctionRoom);
    }, 1500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [room.division, room.current_player_id]);

  const highestBidder = useMemo(() => {
    if (!liveRoom.current_highest_team_id) return null;
    return teams.find((t) => t.id === liveRoom.current_highest_team_id) ?? null;
  }, [liveRoom.current_highest_team_id, teams]);

  const canBid = viewerRole === 'team' && viewerTeamId && liveRoom.status === 'live' && currentPlayer;
  const isLeading = liveRoom.current_highest_team_id === viewerTeamId;

  const spent = useMemo(() => (purchases ?? []).reduce((sum, p) => sum + p.price, 0), [purchases]);
  const remaining = teamPurse ?? 0;

  async function placeBid(increment: number) {
    if (!canBid) return;
    setMessage(null);

    const newBid = Number(liveRoom.current_bid) + increment;
    const prevRoom = liveRoom;
    setLiveRoom({ ...liveRoom, current_bid: newBid, current_highest_team_id: viewerTeamId! });

    startTransition(async () => {
      const response = await fetch('/api/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: liveRoom.id, increment })
      });
      const payload = await response.json();
      if (!response.ok) setLiveRoom(prevRoom);
      setMessage(payload.message ?? (response.ok ? 'Bid placed.' : 'Unable to place bid.'));
    });
  }

  if (!currentPlayer) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8">
        <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center backdrop-blur-sm">
          <Hourglass className="mx-auto h-16 w-16 text-white/20" />
          <p className="mt-6 text-2xl font-black uppercase tracking-[0.12em] text-white">Auction will start soon</p>
          <p className="mt-2 text-sm text-white/40">Wait for the auctioneer to begin.</p>
        </div>
        {purchases ? <PurchasesSection purchases={purchases} teamPurse={teamPurse} /> : null}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-10">
      <div className="flex items-center gap-20">
        <div className="w-[30rem] animate-slide-from-left">
          {currentPlayer.card_image_url ? (
            <Image
              src={currentPlayer.card_image_url}
              alt={currentPlayer.name}
              width={600}
              height={750}
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
          <p className="text-lg font-bold uppercase tracking-[0.2em]" style={{ color: '#264153' }}>Current price</p>
          <p className="mt-3 text-7xl font-black drop-shadow-sm transition-all" style={{ color: '#264153' }}>
            ${currency(liveRoom.current_bid || currentPlayer.base_price)}
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

      <div className="flex flex-wrap items-center justify-center gap-3">
        {INCREMENTS.map((inc) => {
          const disabled = !canBid || isPending || isLeading;
          const bidAmount = Number(liveRoom.current_bid) + inc;
          const exceedsPurse = bidAmount > (teamPurse ?? 0) - spent;
          return (
            <button
              key={inc}
              onClick={() => placeBid(inc)}
              disabled={disabled || exceedsPurse}
              className="flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/10 px-8 py-3.5 font-black text-white shadow-sm backdrop-blur-sm transition hover:border-cyan hover:bg-cyan/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              +${inc}
            </button>
          );
        })}
      </div>

      {message ? (
        <p className="text-sm font-semibold text-white/70">{message}</p>
      ) : null}

      {isLeading ? (
        <p className="inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-5 py-2 text-sm font-bold text-amber">
          <Gavel className="h-4 w-4" /> You are the highest bidder
        </p>
      ) : null}

      {purchases ? <PurchasesSection purchases={purchases} teamPurse={teamPurse} /> : null}

      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.1em] text-white/50">Recent bids</h3>
        <div className="space-y-2">
          {recentBids.length ? recentBids.slice(0, 5).map((bid) => {
            const team = teams.find((item) => item.id === bid.team_id);
            return (
              <div key={bid.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm">
                <span className={team?.id === liveRoom.current_highest_team_id ? 'font-semibold text-amber' : 'text-white/70'}>
                  {team?.name ?? 'Unknown'}
                </span>
                <span className="font-bold text-lime">${currency(bid.amount)}</span>
              </div>
            );
          }) : <p className="text-sm text-white/40">No bids yet for this lot.</p>}
        </div>
      </div>
    </div>
  );
}
