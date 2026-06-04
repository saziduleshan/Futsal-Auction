import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'team' || !session.teamId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const roomId = request.nextUrl.searchParams.get('roomId');
  if (!roomId) {
    return NextResponse.json({ message: 'roomId is required.' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('auction_participants')
    .select('id, connected')
    .eq('room_id', roomId)
    .eq('team_id', session.teamId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ participantId: null, connected: false });
  }

  return NextResponse.json({ participantId: data.id, connected: data.connected });
}
