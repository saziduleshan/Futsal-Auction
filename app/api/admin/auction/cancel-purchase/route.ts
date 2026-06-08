import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { purchaseId, roomId } = await request.json();
  if (!purchaseId || !roomId) {
    return NextResponse.json({ message: 'purchaseId and roomId are required' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const [{ data: room }, { data: purchase }] = await Promise.all([
    supabase.from('auction_rooms').select('id, current_player_id, division').eq('id', roomId).single(),
    supabase.from('purchases').select('id, player_id, team_id, price').eq('id', purchaseId).single()
  ]);

  if (!room || !purchase) {
    return NextResponse.json({ message: 'Room or purchase not found.' }, { status: 404 });
  }

  if (room.current_player_id) {
    return NextResponse.json({ message: 'Cannot cancel purchase while an auction is active.' }, { status: 400 });
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, base_price')
    .eq('id', purchase.player_id)
    .single();

  if (playerError || !player) {
    return NextResponse.json({ message: 'Player not found.' }, { status: 404 });
  }

  const { error: deletePurchaseError } = await supabase
    .from('purchases')
    .delete()
    .eq('id', purchase.id);

  if (deletePurchaseError) {
    return NextResponse.json({ message: 'Failed to delete purchase.' }, { status: 500 });
  }

  const { error: playerUpdateError } = await supabase
    .from('players')
    .update({ status: 'available', sold_price: null, sold_to_team_id: null })
    .eq('id', player.id);

  if (playerUpdateError) {
    return NextResponse.json({ message: 'Failed to update player status.' }, { status: 500 });
  }

  const { data: team, error: teamFetchError } = await supabase
    .from('teams')
    .select('id, purse')
    .eq('id', purchase.team_id)
    .single();

  if (teamFetchError || !team) {
    return NextResponse.json({ message: 'Team not found for refund.' }, { status: 500 });
  }

  const newPurse = Number(team.purse) + Number(purchase.price);

  const { data: refundedTeam, error: teamUpdateErr } = await supabase
    .from('teams')
    .update({ purse: newPurse })
    .eq('id', team.id)
    .eq('purse', team.purse)
    .select('id');

  if (teamUpdateErr || !refundedTeam || refundedTeam.length === 0) {
    return NextResponse.json({ message: 'Team purse conflict. Reload and try again.' }, { status: 409 });
  }

  await supabase.from('bids').delete().eq('room_id', roomId).eq('player_id', player.id);

  const { error: roomUpdateError } = await supabase
    .from('auction_rooms')
    .update({
      current_player_id: player.id,
      current_bid: player.base_price,
      current_highest_team_id: null,
      nominated_at: new Date().toISOString(),
      status: 'live'
    })
    .eq('id', room.id);

  if (roomUpdateError) {
    return NextResponse.json({ message: 'Failed to update auction room.' }, { status: 500 });
  }

  return NextResponse.json({
    playerId: player.id,
    teamId: purchase.team_id,
    refundAmount: purchase.price
  });
}
