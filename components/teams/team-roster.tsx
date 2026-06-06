import Link from 'next/link';
import { Swords } from 'lucide-react';
import type { Player, Purchase, Team } from '@/lib/types';
import { JoinAuctionForm } from '@/components/teams/join-auction-form';
import { EditTeamName } from '@/components/teams/edit-team-name';

export function TeamRoster({ team, players, purchases, teamId, joinedRoomIds }: { team: Team; players: Player[]; purchases: Purchase[]; teamId: string; joinedRoomIds: string[] }) {
  const hasJoined = joinedRoomIds.length > 0;
  const canEdit = teamId === team.id;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-black/60 p-8 shadow-lg backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <span className="badge">{team.division === 'men' ? 'Male Futsal' : 'Female Futsal'}</span>
            <EditTeamName team={team} canEdit={canEdit} />
          </div>
        </div>
      </div>

      {!hasJoined ? (
        <JoinAuctionForm teamId={teamId} />
      ) : (
        <Link
          href="/auction"
          className="flex items-center gap-4 overflow-hidden rounded-[1.75rem] border border-white/20 bg-black/60 p-8 shadow-lg backdrop-blur-xl transition hover:scale-[1.01] hover:shadow-xl"
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-lime/20 to-cyan/20">
            <Swords className="size-8 text-lime" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-[0.12em] text-lime">Live Auction</h2>
            <p className="mt-1 text-sm text-white/50">You have joined. Enter the auction room to start bidding.</p>
          </div>
          <span className="ml-auto rounded-full bg-[#1D3C50] px-4 py-2 text-sm font-bold text-white">Enter</span>
        </Link>
      )}

      <Link
        href={`/teams/${team.slug}/lineup`}
        className="flex items-center gap-4 overflow-hidden rounded-[1.75rem] border border-white/20 bg-black/60 p-8 shadow-lg backdrop-blur-xl transition hover:scale-[1.01] hover:shadow-xl"
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan/20 to-purple/20">
          <Swords className="size-8 text-cyan" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-[0.12em] text-gold">Tactical Board</h2>
          <p className="mt-1 text-sm text-white/50">Arrange your squad on the futsal pitch with drag-and-drop</p>
        </div>
        <span className="ml-auto rounded-full bg-[#1D3C50] px-4 py-2 text-sm font-bold text-white">
          {players.length} player{players.length !== 1 ? 's' : ''}
        </span>
      </Link>
    </div>
  );
}
