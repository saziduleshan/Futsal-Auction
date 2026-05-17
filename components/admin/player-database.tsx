'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Shield, Sparkles, Target, Trophy, Users } from 'lucide-react';
import type { Player, Division, PlayerCategory, PlayerYear } from '@/lib/types';
import { currency, formatCategory } from '@/lib/utils';
import { YEAR_TIERS, PLAYER_CATEGORIES, getYearTier } from '@/lib/constants';

const CATEGORY_ICONS = {
  defender: Shield,
  midfielder: Sparkles,
  forward: Target,
  goalkeeper: Trophy
};

interface PlayerDatabaseProps {
  players: Player[];
}

export function PlayerDatabase({ players }: PlayerDatabaseProps) {
  const [activeDivision, setActiveDivision] = useState<Division>('men');
  const [tierFilter, setTierFilter] = useState<PlayerYear | 'all'>('all');
  const [positionFilter, setPositionFilter] = useState<PlayerCategory | 'all'>('all');

  const divisionPlayers = players.filter(
    (p) => p.division === activeDivision && p.status === 'available'
  );

  const filtered = divisionPlayers.filter((p) => {
    if (tierFilter !== 'all' && p.year !== tierFilter) return false;
    if (positionFilter !== 'all' && p.category !== positionFilter) return false;
    return true;
  });

  const tiers = YEAR_TIERS.map((yt) => yt.value);
  const menCount = players.filter((p) => p.division === 'men' && p.status === 'available').length;
  const womenCount = players.filter((p) => p.division === 'women' && p.status === 'available').length;

  return (
    <div className="panel overflow-hidden p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="badge">Player database</p>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.12em]">Available players</h2>
        </div>
        <p className="text-sm text-gray-400">{players.filter((p) => p.status === 'available').length} total cards</p>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setActiveDivision('men')}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] transition ${
            activeDivision === 'men'
              ? 'bg-cyan text-white shadow'
              : 'border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <Users className="h-4 w-4" />
          Male Futsal
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">{menCount}</span>
        </button>
        <button
          onClick={() => setActiveDivision('women')}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] transition ${
            activeDivision === 'women'
              ? 'bg-magenta text-white shadow'
              : 'border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <Users className="h-4 w-4" />
          Female Futsal
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">{womenCount}</span>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={String(tierFilter)}
          onChange={(e) => setTierFilter(e.target.value === 'all' ? 'all' : e.target.value === 'final' ? 'final' : Number(e.target.value) as PlayerYear)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none"
        >
          <option value="all">All tiers</option>
          {YEAR_TIERS.map((yt) => (
            <option key={String(yt.value)} value={String(yt.value)}>{yt.tier}</option>
          ))}
        </select>
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value as PlayerCategory | 'all')}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none"
        >
          <option value="all">All positions</option>
          {PLAYER_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{formatCategory(cat)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-sm text-gray-400">No players match the selected filters.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((player) => {
            const Icon = CATEGORY_ICONS[player.category];
            const yearTier = getYearTier(player.year);
            return (
              <article key={player.id} className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white transition hover:shadow-md">
                {player.card_image_url ? (
                  <Image
                    src={player.card_image_url}
                    alt={player.name}
                    width={720}
                    height={900}
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-cyan/20 via-purple/10 to-magenta/20">
                    <div className="text-center">
                      <Icon className="mx-auto h-8 w-8 text-white/60" />
                      <p className="mt-2 text-2xl font-black uppercase tracking-[0.1em]">{player.name}</p>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-lg font-black uppercase tracking-[0.08em]">{player.name}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{formatCategory(player.category)}</span>
                    <span className="text-gray-300">·</span>
                    <span className="rounded-full bg-purple/10 px-2 py-0.5 font-semibold text-purple">{yearTier.tier}</span>
                  </div>
                  <p className="mt-2 text-lg font-black text-gold">{currency(player.base_price)}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
