import { NextResponse } from 'next/server';
import { createSessionToken, setSessionCookie, verifyPassword } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!username || !password) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const supabase = createServerSupabase();
  const { data: user, error } = await supabase
    .from('app_users')
    .select('id, username, password_hash, role, display_name, team_id')
    .eq('username', username)
    .single();

  if (error || !user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const token = createSessionToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    teamId: user.team_id
  });

  await setSessionCookie(token);
  const redirectUrl = user.role === 'admin' ? '/admin' : user.team_id ? '/teams/me' : '/auction';
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
