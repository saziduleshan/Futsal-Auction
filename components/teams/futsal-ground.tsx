'use client';

import Image from 'next/image';
import { Shield, Sparkles, Target, Trophy } from 'lucide-react';
import { currency, formatCategory } from '@/lib/utils';
import type { Player, Purchase } from '@/lib/types';

const CATEGORY_ICONS = {
  defender: Shield,
  midfielder: Sparkles,
  forward: Target,
  goalkeeper: Trophy,
};

export function FutsalGround({ players, purchases }: { players: Player[]; purchases?: Purchase[] }) {
  const priceMap = new Map<string, number>();
  if (purchases) {
    for (const p of purchases) {
      const existing = priceMap.get(p.player_id);
      if (!existing || p.price > existing) {
        priceMap.set(p.player_id, p.price);
      }
    }
  }

  if (players.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="font-bold text-white/40">No players yet</p>
        <p className="mt-1 text-sm text-white/20">Players purchased in the auction will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {players.map((player) => {
        const Icon = CATEGORY_ICONS[player.category] || Shield;
        const purchasePrice = priceMap.get(player.id) ?? player.sold_price ?? player.base_price;
        return (
          <div
            key={player.id}
            className="group relative overflow-hidden rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.03] shadow-lg backdrop-blur-sm transition hover:scale-[1.02] hover:border-gold/30 hover:shadow-xl"
          >
            <div className="relative aspect-[3/4]">
              {player.card_image_url ? (
                <Image
                  src={player.card_image_url}
                  alt={player.name}
                  width={240}
                  height={320}
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold/10 via-amber-900/10 to-orange/10">
                  <div className="text-center">
                    <Icon className="mx-auto h-6 w-6 text-gold/40" />
                    <p className="mt-2 px-2 text-sm font-black uppercase tracking-[0.08em] text-gray-500">
                      {player.name}
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="truncate text-xs font-black uppercase tracking-[0.04em] text-white drop-shadow-sm">
                  {player.name}
                </p>
                <div className="mt-0.5 flex items-center gap-1">
                  <Icon className="size-2.5 text-gold" />
                  <span className="text-[10px] font-bold text-gold/90">{formatCategory(player.category)}</span>
                </div>
                <p className="mt-1 text-sm font-black text-gold drop-shadow-sm">${currency(purchasePrice)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
