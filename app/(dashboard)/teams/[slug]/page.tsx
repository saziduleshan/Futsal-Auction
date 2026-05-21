import { notFound, redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { getCurrentUser, getTeamBundleBySlug, getTeamJoinedRooms } from '@/lib/data';
import { TeamRoster } from '@/components/teams/team-roster';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await requireSession();
  const user = await getCurrentUser(session.userId);
  const incoming = await params;
  const slug = incoming.slug === 'me' && session.teamId ? await resolveMySlug(session.teamId) : incoming.slug;

  if (!slug) notFound();

  const bundle = await getTeamBundleBySlug(slug).catch(() => null);
  if (!bundle) notFound();

  if (session.role === 'team' && user.team_id !== bundle.team.id) {
    redirect(`/teams/${await resolveMySlug(user.team_id!)}`);
  }

  const joinedRoomIds = user.team_id ? await getTeamJoinedRooms(user.team_id) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
      <TeamRoster team={bundle.team} players={bundle.players} purchases={bundle.purchases} teamId={user.team_id!} joinedRoomIds={joinedRoomIds} />
    </div>
  );
}

async function resolveMySlug(teamId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from('teams').select('slug').eq('id', teamId).single<{ slug: string }>();
  if (error) throw error;
  return data.slug;
}
