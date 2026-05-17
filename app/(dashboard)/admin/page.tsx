import { requireAdmin } from '@/lib/auth';
import { PlayerForm } from '@/components/admin/player-form';
import Link from 'next/link';
import { Eye, Gavel, Swords } from 'lucide-react';

export default async function AdminPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-6 md:py-12">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <PlayerForm />

        <div className="flex flex-col gap-6">
          <div className="group flex-1 overflow-hidden rounded-[1.75rem] border border-white/20 bg-gray-400/40 shadow-lg backdrop-blur-xl transition hover:shadow-xl hover:-translate-y-0.5">
            <Link href="/admin/players" className="flex h-full flex-col justify-center p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-orange shadow-lg">
                  <Eye className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="badge border-gold/30 text-gold">Player database</p>
                  <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-gold">
                    View all players
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                Browse the full player catalog with division tabs, tier and position filters. Scroll through card views and inspect player details.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.14em] text-gold">
                Browse players <Swords className="h-4 w-4" />
              </div>
            </Link>
          </div>

          <div className="group flex-1 overflow-hidden rounded-[1.75rem] border border-white/20 bg-gray-400/40 shadow-lg backdrop-blur-xl transition hover:shadow-xl hover:-translate-y-0.5">
            <Link href="/admin/auction-setup" className="flex h-full flex-col justify-center p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-purple shadow-lg">
                  <Gavel className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="badge">Run auction</p>
                  <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-gold">
                    Create auction room
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                Configure division, teams, purse size, and bid settings. Then manage the live auction — nominate players, track bids, and close lots.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.14em] text-cyan">
                Open setup <Swords className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
