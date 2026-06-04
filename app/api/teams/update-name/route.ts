import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !session.teamId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { teamId, name } = await request.json();
  if (!teamId || !name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ message: 'A valid team name is required.' }, { status: 400 });
  }

  if (session.teamId !== teamId) {
    return NextResponse.json({ message: 'You can only edit your own team.' }, { status: 403 });
  }

  const trimmed = name.trim().slice(0, 60);
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from('teams')
    .update({ name: trimmed })
    .eq('id', teamId);

  if (error) {
    return NextResponse.json({ message: 'Failed to update team name.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Team name updated.' });
}
