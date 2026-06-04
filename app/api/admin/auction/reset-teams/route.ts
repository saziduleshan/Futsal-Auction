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

  const { data: purchases } = await supabase
    .from('purchases')
    .select('team_id, price, player_id')
    .eq('room_id', roomId);

  if (purchases && purchases.length > 0) {
    const refunds: Record<string, number> = {};
    const playerIds: string[] = [];

    for (const p of purchases) {
      refunds[p.team_id] = (refunds[p.team_id] || 0) + p.price;
      playerIds.push(p.player_id);
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

    if (playerIds.length > 0) {
      await supabase
        .from('players')
        .update({ status: 'available', sold_price: null, sold_to_team_id: null })
        .in('id', playerIds);
    }
  }

  await supabase.from('purchases').delete().eq('room_id', roomId);

  await supabase
    .from('auction_rooms')
    .update({ ended_at: null })
    .eq('id', roomId);

  return NextResponse.json({ message: 'Teams reset successfully.' });
}
