import { requireModerator } from '@/lib/auth';
import { PlayerForm } from '@/components/admin/player-form';
import Link from 'next/link';
import { Swords, Eye } from 'lucide-react';

export default async function ModeratorPage() {
  await requireModerator();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-6 md:py-12">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <PlayerForm />

        <div className="flex flex-col gap-6">
          <div className="group flex-1 overflow-hidden rounded-[1.75rem] border border-white/20 bg-black/60 shadow-lg backdrop-blur-xl transition hover:shadow-xl hover:-translate-y-0.5">
            <Link href="/moderator/players" className="flex h-full flex-col justify-center p-8">
              <div>
                <p className="badge border-gold/30 text-gold text-sm">Player database</p>
                <h3 className="mt-3 text-3xl font-black uppercase tracking-[0.12em] text-gold">
                  View all players
                </h3>
              </div>
              <p className="mt-4 text-base leading-relaxed text-white/70">
                Browse the full player catalog with division tabs. Scroll through card views and inspect player details.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1D3C50] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#0F2838]">
                Browse players <Swords className="h-4 w-4" />
              </div>
            </Link>
          </div>

          <div className="group flex-1 overflow-hidden rounded-[1.75rem] border border-white/20 bg-black/60 shadow-lg backdrop-blur-xl transition hover:shadow-xl hover:-translate-y-0.5">
            <div className="flex h-full flex-col justify-center p-8">
              <div>
                <p className="badge border-gold/30 text-gold text-sm">Info</p>
                <h3 className="mt-3 text-3xl font-black uppercase tracking-[0.12em] text-gold">
                  Moderator access
                </h3>
              </div>
              <p className="mt-4 text-base leading-relaxed text-white/70">
                You can add new player cards and browse the player database. Auction management is handled by the admin.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1D3C50] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white opacity-40">
                <Eye className="h-4 w-4" /> Read only
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
