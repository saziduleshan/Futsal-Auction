import { NextResponse } from 'next/server';
import { createSessionToken, setSessionCookie, verifyPassword } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  let username: string;
  let password: string;

  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    username = String(body.username ?? '').trim().toLowerCase();
    password = String(body.password ?? '');
  } else {
    const text = await request.text();
    const params = new URLSearchParams(text);
    username = String(params.get('username') ?? '').trim().toLowerCase();
    password = String(params.get('password') ?? '');
  }

  if (!username || !password) {
    if (contentType.includes('application/json')) {
      return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 });
    }
    return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
  }

  const supabase = createServerSupabase();
  const { data: user, error } = await supabase
    .from('app_users')
    .select('id, username, password_hash, role, display_name, team_id')
    .eq('username', username)
    .single();

  if (error || !user || !verifyPassword(password, user.password_hash)) {
    if (contentType.includes('application/json')) {
      return NextResponse.json({ message: 'Invalid username or password.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
  }

  const isModerator = user.username.startsWith('moderator');
  const effectiveRole = isModerator ? 'moderator' : user.role;

  const token = createSessionToken({
    userId: user.id,
    username: user.username,
    role: effectiveRole,
    teamId: user.team_id
  });

  await setSessionCookie(token);
  const redirectUrl = effectiveRole === 'admin' ? '/admin' : effectiveRole === 'moderator' ? '/moderator' : user.team_id ? '/teams/me' : '/auction';

  if (contentType.includes('application/json')) {
    return NextResponse.json({ redirect: redirectUrl });
  }
  return NextResponse.redirect(new URL(redirectUrl, request.url), { status: 303 });
}
