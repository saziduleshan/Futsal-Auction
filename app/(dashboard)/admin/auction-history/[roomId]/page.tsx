import { requireAdmin } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { AuctionHistoryDetail } from '@/components/admin/auction-history-detail';
import type { Division, Team, Purchase, Player } from '@/lib/types';

export default async function AuctionHistoryPage({ params }: { params: Promise<{ roomId: string }> }) {
  await requireAdmin();
  const { roomId } = await params;
  const supabase = createServerSupabase();

  const { data: room } = await supabase
    .from('auction_rooms')
    .select('*, division')
    .eq('id', roomId)
    .single();

  if (!room) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-2xl font-black uppercase tracking-[0.12em] text-white/40">Auction not found</p>
      </div>
    );
  }

  const { data: purchases } = await supabase
    .from('purchases')
    .select('*, team_id, player_id, price')
    .eq('room_id', roomId);

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('division', room.division)
    .order('name');

  const playerIds = [...new Set((purchases ?? []).map((p) => p.player_id))];

  let players: Player[] = [];
  if (playerIds.length > 0) {
    const { data } = await supabase
      .from('players')
      .select('*')
      .in('id', playerIds)
      .order('name');
    players = data ?? [];
  }

  const playerMap: Record<string, Player> = {};
  for (const p of players) playerMap[p.id] = p;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
      <AuctionHistoryDetail
        room={room}
        teams={teams ?? []}
        purchases={purchases ?? []}
        playerMap={playerMap}
      />
    </div>
  );
}
