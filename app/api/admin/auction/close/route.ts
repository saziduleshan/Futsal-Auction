import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { roomId, outcome } = await request.json();
  if (!roomId || !outcome) {
    return NextResponse.json({ message: 'roomId and outcome are required' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: room, error: roomError } = await supabase
    .from('auction_rooms')
    .select('id, current_player_id, current_highest_team_id, current_bid')
    .eq('id', roomId)
    .single();

  if (roomError || !room || !room.current_player_id) {
    return NextResponse.json({ message: 'No active player found in this room.' }, { status: 400 });
  }

  if (outcome === 'sold') {
    if (!room.current_highest_team_id) {
      return NextResponse.json({ message: 'There is no highest bidder to sell to.' }, { status: 400 });
    }

    const [{ data: team, error: teamError }, { error: playerError }] = await Promise.all([
      supabase.from('teams').select('id, purse').eq('id', room.current_highest_team_id).single(),
      supabase
        .from('players')
        .update({
          status: 'sold',
          sold_to_team_id: room.current_highest_team_id,
          sold_price: room.current_bid
        })
        .eq('id', room.current_player_id)
    ]);

    if (teamError || playerError || !team) {
      return NextResponse.json({ message: 'Unable to finalize the sale.' }, { status: 500 });
    }

    const { error: teamUpdateError } = await supabase
      .from('teams')
      .update({ purse: Number(team.purse) - Number(room.current_bid) })
      .eq('id', team.id);

    if (teamUpdateError) {
      return NextResponse.json({ message: 'Sale completed, but team purse update failed.' }, { status: 500 });
    }
  }

  if (outcome === 'unsold') {
    const { error: playerError } = await supabase
      .from('players')
      .update({ status: 'available', sold_to_team_id: null, sold_price: null })
      .eq('id', room.current_player_id);

    if (playerError) {
      return NextResponse.json({ message: 'Unable to mark player as unsold.' }, { status: 500 });
    }
  }

  const { error: roomResetError } = await supabase
    .from('auction_rooms')
    .update({
      current_player_id: null,
      current_bid: 0,
      current_highest_team_id: null,
      nominated_at: null,
      status: 'idle'
    })
    .eq('id', room.id);

  if (roomResetError) {
    return NextResponse.json({ message: 'Auction room reset failed.' }, { status: 500 });
  }

  return NextResponse.json({ message: outcome === 'sold' ? 'Player sold successfully.' : 'Player marked unsold.' });
}
