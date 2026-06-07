import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { getCurrentUser, getRoomBundle } from '@/lib/data';
import { createServerSupabase } from '@/lib/supabase/server';
import { LiveAuctionBoard } from '@/components/auction/live-auction-board';
import { TeamAuctionGuard } from '@/components/auction/team-auction-guard';
import { AuctionRoomManager } from '@/components/auction/auction-room-manager';
import type { Bid, Division, Purchase, Player, Team, AuctionRoom } from '@/lib/types';

interface TeamPurchaseDisplay {
  playerName: string;
  price: number;
}

interface DivisionBundle {
  division: Division;
  room: AuctionRoom;
  players: Player[];
  purchases: Purchase[];
  teams: Team[];
  bids: Bid[];
}

export default async function AuctionPage() {
  const session = await requireSession();
  const currentUser = await getCurrentUser(session.userId);

  if (session.role === 'team' && !currentUser.team_id) {
    redirect('/login');
  }

  const supabase = createServerSupabase();

  if (session.role === 'admin') {
    const { data: activeRooms } = await supabase
      .from('auction_rooms')
      .select('division')
      .not('join_code', 'is', 'null')
      .returns<{ division: Division }[]>();

    const activeDivisions = (activeRooms ?? []).map((r) => r.division);

    if (activeDivisions.length === 0) {
      return (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-2xl font-black uppercase tracking-[0.12em] text-white/40">No active auction</p>
            <p className="mt-2 text-sm text-white/30">Set up an auction from the admin panel first.</p>
          </div>
        </div>
      );
    }

    const bundles: DivisionBundle[] = await Promise.all(
      activeDivisions.map(async (division) => {
        const [{ data: room }, { data: availablePlayers }, { data: teams }] = await Promise.all([
          supabase.from('auction_rooms').select('*').eq('division', division).single<AuctionRoom>(),
          supabase.from('players').select('*').eq('division', division).order('created_at', { ascending: false }).returns<Player[]>(),
          supabase.from('teams').select('*').eq('division', division).order('name').returns<Team[]>()
        ]);

        const [purchasesResult, bidsResult] = await Promise.all([
          supabase.from('purchases').select('*').eq('room_id', room!.id).order('created_at').returns<Purchase[]>(),
          supabase.from('bids').select('*').eq('room_id', room!.id).order('created_at', { ascending: false }).limit(20).returns<Bid[]>()
        ]);

        return {
          division,
          room: room!,
          players: availablePlayers ?? [],
          purchases: purchasesResult.data ?? [],
          teams: teams ?? [],
          bids: bidsResult.data ?? []
        };
      })
    );

    return (
      <div className="space-y-12">
        {bundles.map((bundle) => (
          <AuctionRoomManager
            key={bundle.room.id}
            division={bundle.division}
            room={bundle.room}
            players={bundle.players}
            purchases={bundle.purchases}
            teams={bundle.teams}
            initialBids={bundle.bids}
          />
        ))}
      </div>
    );
  }

  const teamId = currentUser.team_id!;

  const { data: teamData } = await supabase
    .from('teams')
    .select('slug')
    .eq('id', teamId)
    .single<{ slug: string }>();

  const teamSlug = teamData?.slug ?? '';

  const divisions: Division[] = [await getTeamDivision(supabase, teamId)];
  const bundles = await Promise.all(divisions.map((division) => getRoomBundle(division)));

  const [{ data: teamInfo }, { data: rawPurchases }] = await Promise.all([
    supabase.from('teams').select('purse').eq('id', teamId).single<{ purse: number }>(),
    supabase.from('purchases').select('player_id, price').eq('team_id', teamId).returns<Pick<Purchase, 'player_id' | 'price'>[]>()
  ]);

  let purchases: TeamPurchaseDisplay[] = [];
  if (rawPurchases && rawPurchases.length > 0) {
    const playerIds = rawPurchases.map((p) => p.player_id);
    const { data: players } = await supabase
      .from('players')
      .select('id, name')
      .in('id', playerIds)
      .returns<{ id: string; name: string }[]>();

    const nameMap: Record<string, string> = {};
    if (players) {
      for (const p of players) nameMap[p.id] = p.name;
    }

    purchases = rawPurchases.map((p) => ({
      playerName: nameMap[p.player_id] ?? 'Unknown',
      price: p.price
    }));
  }

  if (bundles.length > 0 && bundles[0].room.ended_at) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center backdrop-blur-sm">
          <p className="text-4xl font-black uppercase tracking-[0.12em] text-white">Auction has ended</p>
          <p className="mt-3 text-sm text-white/40">Thank you for participating in The Genesis auction.</p>
          <Link
            href={`/teams/${teamSlug}`}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cyan px-8 py-3.5 font-bold text-black transition hover:bg-cyan/90"
          >
            Return to team home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Link href="/">
          <Image
            src="/Genesislogo.png"
            alt="The Genesis"
            width={220}
            height={60}
            className="h-14 w-auto"
            priority
          />
        </Link>
      </div>
      {bundles.map((bundle) => (
        <TeamAuctionGuard
          key={bundle.room.id}
          teamId={teamId}
          roomId={bundle.room.id}
        >
          <LiveAuctionBoard
            divisionLabel={bundle.room.division === 'men' ? 'Male Futsal' : 'Female Futsal'}
            viewerRole={session.role}
            viewerTeamId={session.teamId}
            room={bundle.room}
            currentPlayer={bundle.currentPlayer}
            teams={bundle.teams}
            recentBids={bundle.recentBids}
            teamSlug={teamSlug}
            purchases={purchases}
            teamPurse={teamInfo?.purse ?? 0}
            roomId={bundle.room.id}
          />
        </TeamAuctionGuard>
      ))}
    </div>
  );
}

async function getTeamDivision(supabase: ReturnType<typeof createServerSupabase>, teamId: string) {
  const { data, error } = await supabase
    .from('teams')
    .select('division')
    .eq('id', teamId)
    .single<{ division: Division }>();

  if (error) throw error;
  return data.division;
}
