import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { roomId } = await request.json();
  if (!roomId) {
    return NextResponse.json({ message: 'roomId is required' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { data: room } = await supabase
    .from('auction_rooms')
    .select('id, current_player_id, current_bid, current_highest_team_id, nominated_at')
    .eq('id', roomId)
    .single();

  if (!room || !room.current_player_id) {
    return NextResponse.json({ message: 'No active player in this room.' }, { status: 400 });
  }

  const sessionStart = room.nominated_at ?? new Date(0).toISOString();

  const { data: latestBid } = await supabase
    .from('bids')
    .select('id, team_id, amount')
    .eq('room_id', roomId)
    .eq('player_id', room.current_player_id)
    .gte('created_at', sessionStart)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestBid) {
    return NextResponse.json({ message: 'No bid found to reset.' }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from('bids')
    .delete()
    .eq('id', latestBid.id);

  if (deleteError) {
    return NextResponse.json({ message: 'Could not delete bid.' }, { status: 500 });
  }

  const { data: previousBid } = await supabase
    .from('bids')
    .select('team_id, amount')
    .eq('room_id', roomId)
    .eq('player_id', room.current_player_id)
    .gte('created_at', sessionStart)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousBid) {
    const { error: updateError } = await supabase
      .from('auction_rooms')
      .update({
        current_bid: previousBid.amount,
        current_highest_team_id: previousBid.team_id
      })
      .eq('id', roomId);

    if (updateError) {
      return NextResponse.json({ message: 'Bid deleted but room state update failed.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Most recent bid has been reset.' });
  }

  const { data: player } = await supabase
    .from('players')
    .select('base_price')
    .eq('id', room.current_player_id)
    .single();

  const { error: updateError } = await supabase
    .from('auction_rooms')
    .update({
      current_bid: player?.base_price ?? 0,
      current_highest_team_id: null
    })
    .eq('id', roomId);

  if (updateError) {
    return NextResponse.json({ message: 'Bid deleted but room state update failed.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Bid reset to base price.' });
}
