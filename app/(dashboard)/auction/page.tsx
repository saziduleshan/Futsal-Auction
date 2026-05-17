import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { getCurrentUser, getRoomBundle } from '@/lib/data';
import { createServerSupabase } from '@/lib/supabase/server';
import { LiveAuctionBoard } from '@/components/auction/live-auction-board';
import type { Division } from '@/lib/types';

export default async function AuctionPage() {
  const session = await requireSession();
  const currentUser = await getCurrentUser(session.userId);

  if (session.role === 'team' && !currentUser.team_id) {
    redirect('/login');
  }

  const divisions = session.role === 'admin'
    ? (['men', 'women'] as Division[])
    : [await getTeamDivision(currentUser.team_id!)];

  const bundles = await Promise.all(divisions.map((division) => getRoomBundle(division)));

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-6 md:py-12">
      {bundles.map((bundle) => (
        <LiveAuctionBoard
          key={bundle.room.id}
          divisionLabel={bundle.room.division === 'men' ? 'Male Futsal' : 'Female Futsal'}
          viewerRole={session.role}
          viewerTeamId={session.teamId}
          room={bundle.room}
          currentPlayer={bundle.currentPlayer}
          teams={bundle.teams}
          recentBids={bundle.recentBids}
        />
      ))}
    </div>
    </div>
  );
}

async function getTeamDivision(teamId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('teams')
    .select('division')
    .eq('id', teamId)
    .single<{ division: Division }>();

  if (error) throw error;
  return data.division;
}
