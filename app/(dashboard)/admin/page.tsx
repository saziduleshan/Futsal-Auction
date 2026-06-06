import { requireAdmin } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { PlayerForm } from '@/components/admin/player-form';
import { ResetTeamsButton } from '@/components/admin/reset-teams-button';
import Link from 'next/link';
import { Eye, History, Radio, Swords } from 'lucide-react';

export default async function AdminPage() {
  await requireAdmin();
  const supabase = createServerSupabase();

  const { data: activeRooms } = await supabase
    .from('auction_rooms')
    .select('id, division, status, join_code')
    .not('join_code', 'is', 'null');

  const hasActive = activeRooms && activeRooms.length > 0;

  const { data: endedRooms } = await supabase
    .from('auction_rooms')
    .select('id, division, ended_at')
    .not('ended_at', 'is', 'null')
    .order('ended_at', { ascending: false })
    .limit(1);

  const latestEnded = endedRooms && endedRooms.length > 0 ? endedRooms[0] : null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-6 md:py-12">
      {hasActive ? (
        <div className="rounded-2xl border-2 border-lime/30 bg-gradient-to-br from-lime/20 to-black/60 p-6 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-lime/20">
                <Radio className="size-6 text-lime" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-[0.1em] text-lime">Auction in progress</p>
                <p className="text-sm text-white/60">
                  {activeRooms.map((r) => (r.division === 'men' ? 'Male' : 'Female')).join(' & ')} division
                  {activeRooms.length > 1 ? 's' : ''} — end the auction to clear all purchases.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {activeRooms.map((r) => (
                <Link
                  key={r.id}
                  href="/auction"
                  className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-black transition hover:bg-gold/90"
                >
                  Manage {r.division === 'men' ? 'Male' : 'Female'}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-black/60 shadow-lg backdrop-blur-xl">
        {latestEnded ? (
          <div className="p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-white/10">
                  <History className="size-6 text-white/60" />
                </div>
                <div>
                  <p className="text-lg font-black uppercase tracking-[0.1em] text-white">Auction history</p>
                  <p className="text-sm text-white/40">
                    {latestEnded.division === 'men' ? 'Male Futsal' : 'Female Futsal'} — ended{' '}
                    {new Date(latestEnded.ended_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/admin/auction-history/${latestEnded.id}`}
                  className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  <Eye className="size-4" />
                  Show details
                </Link>
                <ResetTeamsButton roomId={latestEnded.id} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/10">
                <History className="size-6 text-white/30" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-[0.1em] text-white/60">Auction history</p>
                <p className="text-sm text-white/30">No auction to show.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <PlayerForm />

        <div className="flex flex-col gap-6">
          <div className="group flex-1 overflow-hidden rounded-[1.75rem] border border-white/20 bg-black/60 shadow-lg backdrop-blur-xl transition hover:shadow-xl hover:-translate-y-0.5">
            <Link href="/admin/players" className="flex h-full flex-col justify-center p-8">
              <div>
                <p className="badge border-gold/30 text-gold text-sm">Player database</p>
                <h3 className="mt-3 text-3xl font-black uppercase tracking-[0.12em] text-gold">
                  View all players
                </h3>
              </div>
              <p className="mt-4 text-base leading-relaxed text-white/70">
                Browse the full player catalog with division tabs and position filters. Scroll through card views and inspect player details.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1D3C50] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#0F2838]">
                Browse players <Swords className="h-4 w-4" />
              </div>
            </Link>
          </div>

          <div className="group flex-1 overflow-hidden rounded-[1.75rem] border border-white/20 bg-black/60 shadow-lg backdrop-blur-xl transition hover:shadow-xl hover:-translate-y-0.5">
            <Link href="/admin/auction-setup" className="flex h-full flex-col justify-center p-8">
              <div>
                <p className="badge border-gold/30 text-gold text-sm">Run auction</p>
                <h3 className="mt-3 text-3xl font-black uppercase tracking-[0.12em] text-gold">
                  Create auction room
                </h3>
              </div>
              <p className="mt-4 text-base leading-relaxed text-white/70">
                Configure division, teams, purse size, and bid settings. Then manage the live auction — nominate players, track bids, and close lots.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1D3C50] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#0F2838]">
                Open setup <Swords className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
