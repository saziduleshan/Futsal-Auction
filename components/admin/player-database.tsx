'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Shield, Sparkles, Target, Trophy, Users, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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

  const divisionPlayers = useMemo(
    () => players.filter((p) => p.division === activeDivision && p.status === 'available'),
    [players, activeDivision]
  );

  const hasYearData = useMemo(
    () => players.some((p) => p.year !== undefined),
    [players]
  );

  const filtered = useMemo(() => {
    return divisionPlayers.filter((p) => {
      if (tierFilter !== 'all' && p.year !== undefined && p.year !== tierFilter) return false;
      if (tierFilter !== 'all' && p.year === undefined) return false;
      if (positionFilter !== 'all' && p.category !== positionFilter) return false;
      return true;
    });
  }, [divisionPlayers, tierFilter, positionFilter]);

  const menCount = useMemo(
    () => players.filter((p) => p.division === 'men' && p.status === 'available').length,
    [players]
  );
  const womenCount = useMemo(
    () => players.filter((p) => p.division === 'women' && p.status === 'available').length,
    [players]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold hover:text-gold/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to admin
          </Link>
          <p className="badge border-gold/30 text-gold">Player database</p>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.12em] text-gold">
            Available players
          </h2>
        </div>
        <p className="text-sm text-gray-400">
          {players.filter((p) => p.status === 'available').length} total cards
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveDivision('men')}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] transition ${
            activeDivision === 'men'
              ? 'bg-gradient-to-r from-brazil-green to-brazil-yellow text-white shadow-lg'
              : 'border border-white/20 bg-white/70 text-gray-200 backdrop-blur-sm hover:border-white/40 hover:shadow-sm'
          }`}
        >
          <Users className="h-4 w-4" />
          Male Futsal
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
              activeDivision === 'men' ? 'bg-white/20' : 'bg-white/20'
            }`}
          >
            {menCount}
          </span>
        </button>
        <button
          onClick={() => setActiveDivision('women')}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] transition ${
            activeDivision === 'women'
              ? 'bg-gradient-to-r from-magenta to-purple text-white shadow-lg'
              : 'border border-white/20 bg-white/70 text-gray-200 backdrop-blur-sm hover:border-white/40 hover:shadow-sm'
          }`}
        >
          <Users className="h-4 w-4" />
          Female Futsal
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
              activeDivision === 'women' ? 'bg-white/20' : 'bg-white/20'
            }`}
          >
            {womenCount}
          </span>
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={String(tierFilter)}
          onChange={(e) =>
            setTierFilter(
              e.target.value === 'all'
                ? 'all'
                : e.target.value === 'final'
                  ? 'final'
                  : (Number(e.target.value) as PlayerYear)
            )
          }
          className="rounded-xl border border-white/20 bg-white/80 px-4 py-3 text-sm text-gray-800 outline-none backdrop-blur-sm transition focus:border-gold focus:ring-1 focus:ring-gold/30"
        >
          <option value="all">All tiers</option>
          {YEAR_TIERS.map((yt) => (
            <option key={String(yt.value)} value={String(yt.value)}>
              {yt.tier}
            </option>
          ))}
        </select>
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value as PlayerCategory | 'all')}
          className="rounded-xl border border-white/20 bg-white/80 px-4 py-3 text-sm text-gray-800 outline-none backdrop-blur-sm transition focus:border-gold focus:ring-1 focus:ring-gold/30"
        >
          <option value="all">All positions</option>
          {PLAYER_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {formatCategory(cat)}
            </option>
          ))}
        </select>
        {(tierFilter !== 'all' || positionFilter !== 'all') && (
          <button
            onClick={() => {
              setTierFilter('all');
              setPositionFilter('all');
            }}
            className="rounded-xl border border-white/20 bg-white/80 px-4 py-3 text-sm font-semibold text-gray-300 backdrop-blur-sm transition hover:border-red-400 hover:text-red-400"
          >
            Clear filters
          </button>
        )}
      </div>

      {!hasYearData && (
        <div className="rounded-2xl border border-gold/20 bg-gold/5 px-5 py-4">
          <p className="text-sm font-semibold text-gold">
            Tier data not yet available. Run the database migration to enable year/tier-based filtering.
          </p>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/20 bg-white/40 p-16 text-center backdrop-blur-sm">
          <Eye className="mx-auto h-10 w-10 text-white/40" />
          <p className="mt-4 text-lg font-bold uppercase tracking-[0.16em] text-white/80">
            No players match the selected filters
          </p>
          <p className="mt-1 text-sm text-white/60">
            Try adjusting the filters or add new players.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((player) => {
            const Icon = CATEGORY_ICONS[player.category];
            const yearTier = player.year ? getYearTier(player.year) : null;
            return (
              <article
                key={player.id}
                className="group overflow-hidden rounded-[1.75rem] border border-white/20 bg-gray-400/40 shadow-lg backdrop-blur-xl transition hover:shadow-xl hover:-translate-y-0.5"
              >
                {player.card_image_url ? (
                  <Image
                    src={player.card_image_url}
                    alt={player.name}
                    width={720}
                    height={900}
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-gold/10 via-brazil-yellow/5 to-orange/10">
                    <div className="text-center">
                      <Icon className="mx-auto h-10 w-10 text-gold/40" />
                      <p className="mt-3 px-4 text-2xl font-black uppercase tracking-[0.1em] text-gray-700">
                        {player.name}
                      </p>
                    </div>
                  </div>
                )}
                <div className="border-t border-white/10 p-5">
                  <p className="text-lg font-black uppercase tracking-[0.08em]">{player.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Icon className="h-3.5 w-3.5" />
                      {formatCategory(player.category)}
                    </span>
                    {yearTier && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="rounded-full bg-gold/10 px-2 py-0.5 font-bold text-gold">
                          {yearTier.tier}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-3 text-xl font-black text-gold drop-shadow-sm">
                    ${currency(player.base_price)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
