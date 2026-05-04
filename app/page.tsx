import Link from 'next/link';
import { ArrowRight, Coins, Image as ImageIcon, Radio, ShieldCheck, Users } from 'lucide-react';
import { createServerSupabase } from '@/lib/supabase/server';
import { DIVISIONS } from '@/lib/constants';
import { currency } from '@/lib/utils';

export default async function HomePage() {
  const supabase = createServerSupabase();
  const [{ data: teams }, { data: rooms }] = await Promise.all([
    supabase.from('teams').select('id, name, division, purse').order('division').order('name'),
    supabase.from('auction_rooms').select('division, status, current_bid, bid_increment').order('division')
  ]);

  return (
    <div className="grid-overlay">
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="panel overflow-hidden p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <span className="badge">2026-inspired matchday interface</span>
              <h1 className="mt-6 max-w-4xl text-5xl font-black uppercase leading-none tracking-[0.04em] md:text-7xl">
                Run your entire futsal auction from one live command center.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-white/70">
                This platform separates the male and female tournaments, streams live highest bids, shows uploaded player cards, and gives every team its own roster dashboard.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/auction" className="rounded-full bg-lime px-6 py-3 font-black uppercase tracking-[0.18em] text-pitch transition hover:bg-white">
                  Enter Live Auction
                </Link>
                <Link href="/login" className="rounded-full border border-white/15 px-6 py-3 font-black uppercase tracking-[0.18em] text-white transition hover:border-cyan/50 hover:bg-white/5">
                  Team / Admin Login
                </Link>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {[
                  { icon: Radio, title: 'Realtime bidding', text: 'Highest bid updates instantly for every team room.' },
                  { icon: ImageIcon, title: 'Player card uploads', text: 'Admins can upload image-based player cards before live nomination.' },
                  { icon: ShieldCheck, title: 'Role-based access', text: 'Separate experience for admin control and team dashboards.' },
                  { icon: Coins, title: 'Automatic purse tracking', text: 'Team balance drops instantly when a player is sold.' }
                ].map((item) => (
                  <div key={item.title} className="glass rounded-2xl p-4">
                    <item.icon className="h-5 w-5 text-cyan" />
                    <h3 className="mt-3 text-lg font-bold uppercase tracking-[0.12em]">{item.title}</h3>
                    <p className="mt-2 text-sm text-white/65">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              {DIVISIONS.map((division) => {
                const divisionTeams = teams?.filter((team) => team.division === division.value) ?? [];
                const room = rooms?.find((item) => item.division === division.value);
                return (
                  <div key={division.value} className="panel p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="badge">{division.label}</p>
                        <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.12em]">{division.teamCount} Teams</h2>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Room status</p>
                        <p className="mt-1 text-lg font-bold uppercase text-lime">{room?.status ?? 'idle'}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {divisionTeams.map((team) => (
                        <div key={team.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <span className="inline-flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-cyan" />{team.name}</span>
                          <span className="text-sm text-white/70">Purse {currency(team.purse)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <div className="panel p-8 md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="badge">Suggested workflow</p>
              <h2 className="mt-4 section-title">Setup → upload players → go live → sell → review squads</h2>
            </div>
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-full border border-cyan/40 px-5 py-3 font-bold uppercase tracking-[0.16em] text-cyan transition hover:bg-cyan/10">
              Open control room <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
