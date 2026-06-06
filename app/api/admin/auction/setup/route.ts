import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

function generateJoinCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { division, teamCount, purseSize } = await request.json();
  if (!division) {
    return NextResponse.json({ message: 'Division is required.' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { data: room, error } = await supabase
    .from('auction_rooms')
    .select('id, join_code')
    .eq('division', division)
    .single();

  if (error || !room) {
    return NextResponse.json({ message: 'No auction room found for this division.' }, { status: 400 });
  }

  const joinCode = room.join_code || generateJoinCode();

  await supabase
    .from('auction_rooms')
    .update({
      join_code: joinCode,
      ended_at: null,
      current_player_id: null,
      current_bid: 0,
      current_highest_team_id: null,
      nominated_at: null,
      status: 'idle'
    })
    .eq('id', room.id);

  await supabase
    .from('bids')
    .delete()
    .eq('room_id', room.id);

  await supabase
    .from('players')
    .update({ status: 'available', sold_price: null, sold_to_team_id: null })
    .eq('division', division);

  if (teamCount && purseSize) {
    const { data: teams } = await supabase
      .from('teams')
      .select('id')
      .eq('division', division)
      .limit(Number(teamCount));

    if (teams) {
      const teamIds = teams.map((t) => t.id);
      await supabase.from('teams').update({ purse: Number(purseSize) }).in('id', teamIds);
    }
  }

  return NextResponse.json({ message: 'Room ready.', roomId: room.id, joinCode });
}
