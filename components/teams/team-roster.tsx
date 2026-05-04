import Image from 'next/image';
import { Coins, Shield, Sparkles, Target, Trophy } from 'lucide-react';
import type { Player, Team } from '@/lib/types';
import { currency, formatCategory } from '@/lib/utils';

const CATEGORY_ICONS = {
  defender: Shield,
  midfielder: Sparkles,
  forward: Target,
  goalkeeper: Trophy
};

export function TeamRoster({ team, players }: { team: Team; players: Player[] }) {
  const totalSpent = players.reduce((sum, player) => sum + (player.sold_price ?? 0), 0);
  const grouped = ['goalkeeper', 'defender', 'midfielder', 'forward'].map((category) => ({
    category,
    players: players.filter((player) => player.category === category)
  }));

  return (
    <div className="space-y-8">
      <div className="panel p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="badge">{team.division === 'men' ? 'Male Futsal' : 'Female Futsal'}</span>
            <h1 className="mt-4 text-4xl font-black uppercase tracking-[0.12em] md:text-5xl">{team.name}</h1>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="glass rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Players bought</p>
              <p className="mt-2 text-3xl font-black uppercase tracking-[0.12em] text-cyan">{players.length}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Remaining purse</p>
              <p className="mt-2 text-3xl font-black uppercase tracking-[0.12em] text-lime">{currency(team.purse)}</p>
            </div>
            <div className="glass rounded-2xl p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Total spent</p>
              <p className="mt-2 inline-flex items-center gap-2 text-3xl font-black uppercase tracking-[0.12em] text-gold"><Coins className="h-6 w-6" />{currency(totalSpent)}</p>
            </div>
          </div>
        </div>
      </div>

      {grouped.map((group) => {
        const Icon = CATEGORY_ICONS[group.category as keyof typeof CATEGORY_ICONS];
        return (
          <section key={group.category} className="panel p-8">
            <div className="flex items-center gap-3">
              <Icon className="h-6 w-6 text-cyan" />
              <h2 className="text-2xl font-black uppercase tracking-[0.12em]">{formatCategory(group.category)}</h2>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {group.players.length ? group.players.map((player) => (
                <article key={player.id} className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
                  {player.card_image_url ? (
                    <Image src={player.card_image_url} alt={player.name} width={720} height={900} className="aspect-[4/5] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-cyan/20 to-magenta/20">
                      <p className="text-3xl font-black uppercase tracking-[0.12em]">{player.name}</p>
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xl font-black uppercase tracking-[0.08em]">{player.name}</p>
                    <p className="mt-2 text-sm uppercase tracking-[0.18em] text-white/55">Bought for</p>
                    <p className="mt-1 text-2xl font-black text-lime">{currency(player.sold_price)}</p>
                  </div>
                </article>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/55">
                  No players purchased yet in this category.
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
