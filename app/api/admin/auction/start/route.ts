import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { roomId, playerId } = await request.json();
  if (!roomId || !playerId) {
    return NextResponse.json({ message: 'roomId and playerId are required' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const [{ data: room, error: roomError }, { data: player, error: playerError }] = await Promise.all([
    supabase.from('auction_rooms').select('id, division').eq('id', roomId).single(),
    supabase.from('players').select('id, division, base_price, status').eq('id', playerId).single()
  ]);

  if (roomError || playerError || !room || !player) {
    return NextResponse.json({ message: 'Unable to load selected room or player.' }, { status: 400 });
  }

  if (room.division !== player.division) {
    return NextResponse.json({ message: 'Selected player belongs to another division.' }, { status: 400 });
  }

  if (player.status !== 'available') {
    return NextResponse.json({ message: 'Player is not available anymore.' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('auction_rooms')
    .update({
      current_player_id: player.id,
      current_bid: player.base_price,
      current_highest_team_id: null,
      status: 'live',
      nominated_at: new Date().toISOString()
    })
    .eq('id', room.id)
    .eq('status', 'idle')
    .select('id');

  if (error) {
    return NextResponse.json({ message: 'Could not start the auction lot.' }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json({ message: 'Auction is already running for this room.' }, { status: 409 });
  }

  return NextResponse.json({ message: 'Auction lot started.' });
}
