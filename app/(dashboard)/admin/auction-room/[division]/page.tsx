import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { AuctionRoomManager } from '@/components/auction/auction-room-manager';
import type { Bid, Division, Purchase } from '@/lib/types';

export default async function AuctionRoomPage({ params }: { params: Promise<{ division: string }> }) {
  await requireAdmin();
  const { division: raw } = await params;

  if (raw !== 'men' && raw !== 'women') notFound();
  const division = raw as Division;

  const supabase = createServerSupabase();

  const roomResult = supabase.from('auction_rooms').select('*').eq('division', division).single();

  const [{ data: room }, { data: availablePlayers }, { data: teams }] = await Promise.all([
    roomResult,
    supabase
      .from('players')
      .select('*')
      .eq('division', division)
      .order('created_at', { ascending: false }),
    supabase.from('teams').select('*').eq('division', division).order('name')
  ]);

  if (!room || !availablePlayers || !teams) notFound();

  const { data: purchases } = await supabase
    .from('purchases')
    .select('*')
    .eq('room_id', room.id)
    .order('created_at');

  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .eq('room_id', room.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <>
      <div className="fixed inset-0 z-[-1] bg-white" />
      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6">
        <AuctionRoomManager
          division={division}
          room={room}
          players={availablePlayers}
          purchases={purchases ?? []}
          teams={teams}
          initialBids={bids as Bid[] ?? []}
        />
      </div>
    </>
  );
}
