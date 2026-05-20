import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { AuctionRoomManager } from '@/components/auction/auction-room-manager';
import type { Division } from '@/lib/types';

export default async function AuctionRoomPage({ params }: { params: Promise<{ division: string }> }) {
  await requireAdmin();
  const { division: raw } = await params;

  if (raw !== 'men' && raw !== 'women') notFound();
  const division = raw as Division;

  const supabase = createServerSupabase();

  const [{ data: room }, { data: players }, { data: teams }] = await Promise.all([
    supabase.from('auction_rooms').select('*').eq('division', division).single(),
    supabase
      .from('players')
      .select('*')
      .eq('division', division)
      .eq('status', 'available')
      .order('category')
      .order('name'),
    supabase.from('teams').select('*').eq('division', division).order('name')
  ]);

  if (!room || !players || !teams) notFound();

  return (
    <>
      <div className="fixed inset-0 z-[-1] bg-white" />
      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6">
        <AuctionRoomManager
          division={division}
          room={room}
          players={players}
          teams={teams}
        />
      </div>
    </>
  );
}
