import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();

  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('slug', 'men-team-1')
    .single();

  if (!team) {
    return NextResponse.json({ message: 'Men Team 1 not found.' }, { status: 404 });
  }

  const { data: room } = await supabase
    .from('auction_rooms')
    .select('id')
    .eq('division', 'men')
    .single();

  if (!room) {
    return NextResponse.json({ message: 'Men auction room not found.' }, { status: 404 });
  }

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, base_price')
    .eq('division', 'men')
    .eq('status', 'available');

  if (playersError) {
    return NextResponse.json({ message: 'Failed to load players.' }, { status: 500 });
  }

  if (!players || players.length === 0) {
    return NextResponse.json({ message: 'No available male players found.' });
  }

  const purchases = players.map((p) => ({
    room_id: room.id,
    player_id: p.id,
    team_id: team.id,
    price: p.base_price
  }));

  const { error: insertError } = await supabase.from('purchases').insert(purchases);

  if (insertError) {
    return NextResponse.json({ message: 'Failed to create purchases: ' + insertError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('players')
    .update({ sold_to_team_id: team.id, status: 'sold' })
    .eq('division', 'men')
    .eq('status', 'available');

  if (updateError) {
    return NextResponse.json({ message: 'Purchases created but player update failed.' }, { status: 500 });
  }

  return NextResponse.json({
    message: `Seeded ${players.length} male players to Men Team 1.`
  });
}
