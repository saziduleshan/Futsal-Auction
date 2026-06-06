import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { division } = await request.json();
  const supabase = createServerSupabase();

  let query = supabase.from('auction_rooms').select('id');
  if (division) query = query.eq('division', division);

  const { data: rooms, error: roomsError } = await query;

  if (roomsError) {
    return NextResponse.json({ message: 'Unable to load rooms.' }, { status: 500 });
  }

  const roomIds = rooms.map((r) => r.id);

  await supabase.from('auction_participants').delete().in('room_id', roomIds);

  await supabase
    .from('auction_rooms')
    .update({
      current_player_id: null,
      current_bid: 0,
      current_highest_team_id: null,
      nominated_at: null,
      join_code: null,
      status: 'idle',
      ended_at: new Date().toISOString()
    })
    .in('id', roomIds);

  if (division) {
    await supabase
      .from('players')
      .update({ status: 'available', sold_price: null, sold_to_team_id: null })
      .eq('division', division)
      .neq('status', 'available');
  }

  return NextResponse.json({
    message: division
      ? `Auction ended for ${division}.`
      : 'All auctions ended.'
  });
}
