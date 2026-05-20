import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { division } = await request.json();
  if (!division) {
    return NextResponse.json({ message: 'Division is required.' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { data: room, error } = await supabase
    .from('auction_rooms')
    .select('id')
    .eq('division', division)
    .single();

  if (error || !room) {
    return NextResponse.json({ message: 'No auction room found for this division.' }, { status: 400 });
  }

  return NextResponse.json({ message: 'Room ready.', roomId: room.id });
}
