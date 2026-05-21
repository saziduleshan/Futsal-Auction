import Link from 'next/link';
import { Coins, Swords } from 'lucide-react';
import type { Player, Purchase, Team } from '@/lib/types';
import { currency } from '@/lib/utils';
import { JoinAuctionForm } from '@/components/teams/join-auction-form';

export function TeamRoster({ team, players, purchases, teamId, joinedRoomIds }: { team: Team; players: Player[]; purchases: Purchase[]; teamId: string; joinedRoomIds: string[] }) {
  const totalSpent = purchases.reduce((sum, p) => sum + p.price, 0);
  const hasJoined = joinedRoomIds.length > 0;

  return (
    <div className="space-y-8">
      <div className="panel p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="badge">{team.division === 'men' ? 'Male Futsal' : 'Female Futsal'}</span>
            <h1 className="mt-4 text-4xl font-black uppercase tracking-[0.12em] text-gold md:text-5xl">{team.name}</h1>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-cyan/40 bg-gradient-to-br from-cyan/25 to-cyan/5 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan">Players bought</p>
              <p className="mt-2 text-3xl font-black uppercase tracking-[0.12em] text-white">{players.length}</p>
            </div>
            <div className="rounded-2xl border border-lime/40 bg-gradient-to-br from-lime/25 to-lime/5 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime">Remaining purse</p>
              <p className="mt-2 text-3xl font-black uppercase tracking-[0.12em] text-white">{currency(team.purse)}</p>
            </div>
            <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/25 to-gold/5 p-4 backdrop-blur md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Total spent</p>
              <p className="mt-2 inline-flex items-center gap-2 text-3xl font-black uppercase tracking-[0.12em] text-white">
                <Coins className="h-6 w-6 text-gold" />{currency(totalSpent)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!hasJoined ? (
        <JoinAuctionForm teamId={teamId} />
      ) : (
        <Link
          href="/auction"
          className="panel flex items-center gap-4 p-8 transition hover:scale-[1.01] hover:shadow-xl"
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-lime/20 to-cyan/20">
            <Swords className="size-8 text-lime" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-[0.12em] text-lime">Live Auction</h2>
            <p className="mt-1 text-sm text-white/50">You have joined. Enter the auction room to start bidding.</p>
          </div>
          <span className="ml-auto rounded-full bg-lime px-4 py-2 text-sm font-bold text-black">Enter</span>
        </Link>
      )}

      <Link
        href={`/teams/${team.slug}/lineup`}
        className="panel flex items-center gap-4 p-8 transition hover:scale-[1.01] hover:shadow-xl"
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan/20 to-purple/20">
          <Swords className="size-8 text-cyan" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-[0.12em] text-gold">Tactical Board</h2>
          <p className="mt-1 text-sm text-white/50">Arrange your squad on the futsal pitch with drag-and-drop</p>
        </div>
        <span className="ml-auto rounded-full bg-gold px-4 py-2 text-sm font-bold text-black">
          {players.length} player{players.length !== 1 ? 's' : ''}
        </span>
      </Link>
    </div>
  );
}
