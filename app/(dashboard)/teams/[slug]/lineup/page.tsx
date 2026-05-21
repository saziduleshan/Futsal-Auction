import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireSession } from '@/lib/auth';
import { getCurrentUser, getTeamBundleBySlug } from '@/lib/data';
import { FutsalGround } from '@/components/teams/futsal-ground';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function LineupPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await requireSession();
  const user = await getCurrentUser(session.userId);
  const incoming = await params;
  const slug = incoming.slug === 'me' && session.teamId ? await resolveMySlug(session.teamId) : incoming.slug;

  if (!slug) notFound();

  const bundle = await getTeamBundleBySlug(slug).catch(() => null);
  if (!bundle) notFound();

  if (session.role === 'team' && user.team_id !== bundle.team.id) {
    redirect(`/teams/${await resolveMySlug(user.team_id!)}/lineup`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-12">
      <Link
        href={`/teams/${incoming.slug}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back to {bundle.team.name}
      </Link>

      <div className="mb-8">
        <span className="badge">{bundle.team.division === 'men' ? 'Male Futsal' : 'Female Futsal'}</span>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-[0.12em] text-gold md:text-5xl">{bundle.team.name}</h1>
        <p className="mt-2 text-sm text-white/40">Drag and drop players onto the pitch to set your lineup</p>
      </div>

      <FutsalGround players={bundle.players} />
    </div>
  );
}

async function resolveMySlug(teamId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from('teams').select('slug').eq('id', teamId).single<{ slug: string }>();
  if (error) throw error;
  return data.slug;
}
