'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Clock3, Gavel, Radio, ShieldAlert, Wallet } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { currency, formatCategory } from '@/lib/utils';
import type { AuctionRoom, Bid, Player, Team, UserRole } from '@/lib/types';

interface LiveAuctionBoardProps {
  divisionLabel: string;
  viewerRole: UserRole;
  viewerTeamId?: string | null;
  room: AuctionRoom;
  currentPlayer: Player | null;
  teams: Team[];
  recentBids: Bid[];
}

export function LiveAuctionBoard({ divisionLabel, viewerRole, viewerTeamId, room, currentPlayer, teams, recentBids }: LiveAuctionBoardProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`auction-room-${room.division}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_rooms', filter: `division=eq.${room.division}` }, () => {
        router.refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids', filter: `room_id=eq.${room.id}` }, () => {
        router.refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `division=eq.${room.division}` }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.division, room.id, router]);

  const highestTeam = useMemo(() => teams.find((team) => team.id === room.current_highest_team_id), [room.current_highest_team_id, teams]);
  const canBid = viewerRole === 'team' && viewerTeamId && room.status === 'live' && currentPlayer;
  const nextBidLabel = room.current_highest_team_id ? `Bid +${currency(room.bid_increment)}` : `Open at ${currency(room.current_bid)}`;

  async function placeBid() {
    if (!canBid) return;
    setMessage(null);
    startTransition(async () => {
      const response = await fetch('/api/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id })
      });
      const payload = await response.json();
      setMessage(payload.message ?? (response.ok ? 'Bid placed.' : 'Unable to place bid.'));
      router.refresh();
    });
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-white/10 px-6 py-5 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="badge">{divisionLabel}</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.14em] md:text-4xl">Live Auction Room</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan/10 to-purple/10 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Status</p>
              <p className="mt-1 inline-flex items-center gap-2 text-lg font-bold uppercase text-lime">
                <Radio className="h-4 w-4" /> {room.status}
              </p>
            </div>
            <div className="rounded-2xl border border-orange/20 bg-orange/5 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Bid step</p>
              <p className="mt-1 text-lg font-bold text-orange">{currency(room.bid_increment)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-white/10 p-6 md:border-b-0 md:border-r md:border-white/10 md:p-8">
          {currentPlayer ? (
            <>
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
                {currentPlayer.card_image_url ? (
                  <Image
                    src={currentPlayer.card_image_url}
                    alt={currentPlayer.name}
                    width={900}
                    height={1200}
                    className="aspect-[4/5] w-full object-cover"
                  />
                  ) : (
                  <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-cyan/20 via-purple/10 to-magenta/20">
                    <div className="text-center">
                      <p className="text-sm uppercase tracking-[0.24em] text-white/60">Player card</p>
                      <p className="mt-3 text-4xl font-black uppercase tracking-[0.12em]">{currentPlayer.name}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-cyan/20 bg-gradient-to-br from-cyan/10 to-transparent p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">Category</p>
                  <p className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-cyan">{formatCategory(currentPlayer.category)}</p>
                </div>
                <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 to-transparent p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">Base price</p>
                  <p className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-gold">{currency(currentPlayer.base_price)}</p>
                </div>
                <div className="rounded-2xl border border-lime/20 bg-gradient-to-br from-lime/10 to-transparent p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">Going at</p>
                  <p className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-lime">{currency(room.current_bid)}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[460px] items-center justify-center rounded-[2rem] border border-dashed border-cyan/20 bg-gradient-to-br from-cyan/[0.04] via-transparent to-magenta/[0.04] p-10 text-center">
              <div>
                <ShieldAlert className="mx-auto h-10 w-10 text-cyan/50" />
                <p className="mt-4 text-lg font-bold uppercase tracking-[0.16em] text-white/80">No player is currently nominated</p>
                <p className="mt-2 text-sm text-white/55">An admin can start the next lot from the control room.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/[0.06] to-transparent p-6 shadow-glow-gold">
            <p className="text-xs uppercase tracking-[0.22em] text-white/55">Current leader</p>
            <p className="mt-3 text-4xl font-black uppercase tracking-[0.12em] text-gold">
              {highestTeam?.name ?? 'Waiting for first bid'}
            </p>
            <div className="mt-5 flex items-center gap-3 text-white/70">
              <Gavel className="h-5 w-5 text-gold" />
              Highest bid: <span className="font-black text-white">{currency(room.current_bid)}</span>
            </div>

            {viewerRole === 'team' ? (
              <button
                onClick={placeBid}
                disabled={!canBid || isPending}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-lime to-cyan px-5 py-4 font-black uppercase tracking-[0.18em] text-pitch transition hover:from-white hover:to-white disabled:cursor-not-allowed disabled:from-white/10 disabled:to-white/10 disabled:text-white/45"
              >
                {isPending ? 'Submitting…' : nextBidLabel}
              </button>
            ) : null}

            {message ? <p className="mt-3 text-sm text-white/70">{message}</p> : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {teams.map((team) => (
              <div key={team.id} className={`rounded-2xl border p-4 transition ${room.current_highest_team_id === team.id ? 'border-gold/30 bg-gradient-to-br from-gold/[0.08] to-transparent' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold uppercase tracking-[0.08em]">{team.name}</p>
                  {room.current_highest_team_id === team.id ? <span className="badge border-gold/30 text-gold">Leading</span> : null}
                </div>
                <p className={`mt-3 inline-flex items-center gap-2 text-sm ${room.current_highest_team_id === team.id ? 'text-gold/80' : 'text-white/65'}`}><Wallet className="h-4 w-4 text-cyan" />Purse {currency(team.purse)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-purple/20 bg-gradient-to-br from-purple/[0.06] to-transparent p-6">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-purple" />
              <h3 className="text-lg font-black uppercase tracking-[0.12em]">Recent bids</h3>
            </div>
            <div className="mt-4 space-y-3">
              {recentBids.length ? recentBids.map((bid) => {
                const team = teams.find((item) => item.id === bid.team_id);
                return (
                  <div key={bid.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:border-purple/20">
                    <span className={team?.id === room.current_highest_team_id ? 'text-gold font-semibold' : ''}>{team?.name ?? 'Unknown team'}</span>
                    <span className="font-bold text-lime">{currency(bid.amount)}</span>
                  </div>
                );
              }) : <p className="text-sm text-white/55">No bids yet for this lot.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
