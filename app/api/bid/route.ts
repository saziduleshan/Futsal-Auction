import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'team' || !session.teamId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { roomId, increment } = await request.json();
  if (!roomId) {
    return NextResponse.json({ message: 'roomId is required' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const [{ data: team, error: teamError }, { data: room, error: roomError }] = await Promise.all([
    supabase.from('teams').select('id, division, purse, name').eq('id', session.teamId).single(),
    supabase.from('auction_rooms').select('id, division, current_player_id, current_bid, current_highest_team_id, bid_increment, status').eq('id', roomId).single()
  ]);

  if (teamError || roomError || !team || !room) {
    return NextResponse.json({ message: 'Unable to load auction room.' }, { status: 400 });
  }

  if (team.division !== room.division) {
    return NextResponse.json({ message: 'You can only bid in your own division.' }, { status: 403 });
  }

  if (room.status !== 'live' || !room.current_player_id) {
    return NextResponse.json({ message: 'No live player is open for bidding.' }, { status: 400 });
  }

  if (room.current_highest_team_id === team.id) {
    return NextResponse.json({ message: 'You already have the highest bid.' }, { status: 400 });
  }

  const bidIncrement = increment ?? Number(room.bid_increment);
  const amount = Number(room.current_bid) + Number(bidIncrement);
  if (team.purse < amount) {
    return NextResponse.json({ message: 'Insufficient purse for this bid.' }, { status: 400 });
  }

  const { error: bidError } = await supabase.from('bids').insert({
    room_id: room.id,
    player_id: room.current_player_id,
    team_id: team.id,
    amount
  });

  if (bidError) {
    return NextResponse.json({ message: 'Could not record bid.' }, { status: 500 });
  }

  let bidQuery = supabase
    .from('auction_rooms')
    .update({
      current_bid: amount,
      current_highest_team_id: team.id
    })
    .eq('id', room.id)
    .eq('current_bid', room.current_bid);

  if (room.current_highest_team_id === null) {
    bidQuery = bidQuery.is('current_highest_team_id', null);
  } else {
    bidQuery = bidQuery.eq('current_highest_team_id', room.current_highest_team_id);
  }

  const { data: updatedRoom, error: roomUpdateError } = await bidQuery
    .select('id')
    .single();

  if (roomUpdateError || !updatedRoom) {
    await supabase.from('bids').delete().eq('room_id', room.id).eq('team_id', team.id).eq('amount', amount);
    return NextResponse.json({ message: 'Bid was overtaken by another team. Please try again.' }, { status: 409 });
  }

  return NextResponse.json({ message: `Bid placed for ${amount}.` });
}
