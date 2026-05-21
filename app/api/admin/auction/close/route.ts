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
    .select('id, current_player_id, current_highest_team_id, current_bid, division')
    .eq('id', roomId)
    .single();

  if (roomError || !room || !room.current_player_id) {
    return NextResponse.json({ message: 'No active player found in this room.' }, { status: 400 });
  }

  if (outcome === 'sold') {
    if (!room.current_highest_team_id) {
      return NextResponse.json({ message: 'There is no highest bidder to sell to.' }, { status: 400 });
    }

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, purse')
      .eq('id', room.current_highest_team_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ message: 'Unable to load team.' }, { status: 500 });
    }

    const newPurse = Number(team.purse) - Number(room.current_bid);
    if (newPurse < 0) {
      return NextResponse.json({ message: 'Team does not have enough purse.' }, { status: 400 });
    }

    const { error: purchaseError } = await supabase.from('purchases').insert({
      room_id: room.id,
      player_id: room.current_player_id,
      team_id: room.current_highest_team_id,
      price: room.current_bid
    });

    if (purchaseError) {
      return NextResponse.json({ message: 'Unable to record purchase.' }, { status: 500 });
    }

    const { error: teamUpdateError } = await supabase
      .from('teams')
      .update({ purse: newPurse })
      .eq('id', team.id);

    if (teamUpdateError) {
      return NextResponse.json({ message: 'Sale recorded, but purse update failed.' }, { status: 500 });
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
