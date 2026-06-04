import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'team' || !session.teamId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { participantId } = await request.json();
  if (!participantId) {
    return NextResponse.json({ message: 'Participant ID is required.' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('auction_participants')
    .update({ connected: false })
    .eq('id', participantId)
    .eq('team_id', session.teamId);

  if (error) {
    return NextResponse.json({ message: 'Failed to update status.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Disconnected.' });
}
