import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'team' || !session.teamId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code || typeof code !== 'string' || code.length !== 6) {
    return NextResponse.json({ message: 'A valid 6-character code is required.' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const upperCode = code.toUpperCase();

  const { data: room, error: roomError } = await supabase
    .from('auction_rooms')
    .select('id, division')
    .eq('join_code', upperCode)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ message: 'Invalid join code.' }, { status: 404 });
  }

  const { data: team } = await supabase
    .from('teams')
    .select('id, division')
    .eq('id', session.teamId)
    .single();

  if (!team) {
    return NextResponse.json({ message: 'Team not found.' }, { status: 404 });
  }

  if (team.division !== room.division) {
    return NextResponse.json({ message: 'This code does not match your division.' }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from('auction_participants')
    .select('id')
    .eq('room_id', room.id)
    .eq('team_id', team.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('auction_participants')
      .update({ connected: true })
      .eq('id', existing.id);

    return NextResponse.json({ message: 'Rejoined the auction!' });
  }

  const { error: insertError } = await supabase
    .from('auction_participants')
    .insert({ room_id: room.id, team_id: team.id, connected: true });

  if (insertError) {
    return NextResponse.json({ message: 'Unable to join auction.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Successfully joined the auction!' });
}
