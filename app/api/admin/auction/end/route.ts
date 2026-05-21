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

  const { data: purchases } = await supabase
    .from('purchases')
    .select('team_id, price')
    .in('room_id', roomIds);

  if (purchases && purchases.length > 0) {
    const refunds: Record<string, number> = {};
    for (const p of purchases) {
      refunds[p.team_id] = (refunds[p.team_id] || 0) + p.price;
    }

    for (const [teamId, amount] of Object.entries(refunds)) {
      const { data: team } = await supabase
        .from('teams')
        .select('purse')
        .eq('id', teamId)
        .single();

      if (team) {
        await supabase
          .from('teams')
          .update({ purse: Number(team.purse) + amount })
          .eq('id', teamId);
      }
    }
  }

  await supabase.from('purchases').delete().in('room_id', roomIds);

  await supabase
    .from('auction_rooms')
    .update({
      current_player_id: null,
      current_bid: 0,
      current_highest_team_id: null,
      nominated_at: null,
      status: 'idle'
    })
    .in('id', roomIds);

  return NextResponse.json({
    message: division
      ? `Auction ended for ${division}. All purchases cleared.`
      : 'All auctions ended. All purchases cleared.'
  });
}
