'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Shield, Sparkles, Target, Trophy, X } from 'lucide-react';
import type { AuctionRoom, Team, Purchase, Player } from '@/lib/types';
import { currency, formatCategory } from '@/lib/utils';

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  defender: Shield,
  midfielder: Sparkles,
  forward: Target,
  goalkeeper: Trophy
};

interface AuctionHistoryDetailProps {
  room: AuctionRoom;
  teams: Team[];
  purchases: Purchase[];
  playerMap: Record<string, Player>;
}

export function AuctionHistoryDetail({ room, teams, purchases, playerMap }: AuctionHistoryDetailProps) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const toggleTeam = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const filteredPurchases = useMemo(() => {
    if (selectedTeams.length === 0) return purchases;
    return purchases.filter((p) => selectedTeams.includes(p.team_id));
  }, [purchases, selectedTeams]);

  const teamPlayers = useMemo(() => {
    const map: Record<string, { player: Player; price: number }[]> = {};
    for (const team of teams) {
      const teamPurchases = purchases.filter((p) => p.team_id === team.id);
      const items = teamPurchases
        .map((p) => {
          const player = playerMap[p.player_id];
          return player ? { player, price: p.price } : null;
        })
        .filter((item): item is { player: Player; price: number } => item !== null);
      if (items.length > 0) map[team.id] = items;
    }
    return map;
  }, [teams, purchases, playerMap]);

  const totalSpent = useMemo(
    () => purchases.reduce((sum, p) => sum + p.price, 0),
    [purchases]
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">
          {room.division === 'men' ? 'Male Futsal' : 'Female Futsal'} Auction History
        </p>
        <p className="mt-1 text-3xl font-black uppercase tracking-[0.08em] text-white">
          {purchases.length} players sold — ${currency(totalSpent)} total
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {teams.map((team) => {
          const isSelected = selectedTeams.includes(team.id);
          const count = teamPlayers[team.id]?.length ?? 0;
          return (
            <button
              key={team.id}
              onClick={() => toggleTeam(team.id)}
              className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition ${
                isSelected
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
              }`}
            >
              {team.name}
              <span className={`rounded-full px-2 py-0.5 text-xs ${isSelected ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white/50'}`}>
                {count}
              </span>
              {isSelected ? <X className="size-3.5" /> : null}
            </button>
          );
        })}
        {selectedTeams.length > 0 && (
          <button
            onClick={() => setSelectedTeams([])}
            className="text-sm font-bold text-white/40 hover:text-white/70"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filteredPurchases.map((purchase) => {
          const player = playerMap[purchase.player_id];
          const team = teams.find((t) => t.id === purchase.team_id);
          if (!player) return null;
          const Icon = CATEGORY_ICONS[player.category] ?? Shield;
          return (
            <div
              key={purchase.id}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition hover:border-gold/30 hover:shadow-lg"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                {player.card_image_url ? (
                  <Image
                    src={player.card_image_url}
                    alt={player.name}
                    width={400}
                    height={500}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                    <Icon className="h-16 w-16 text-white/20" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5 p-3">
                <p className="truncate text-sm font-bold text-white">{player.name}</p>
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3 text-gold" />
                  <p className="text-xs text-white/40">{formatCategory(player.category)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30">{team?.name ?? 'Unknown'}</span>
                  <span className="text-sm font-black text-gold">${currency(purchase.price)}</span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredPurchases.length === 0 && (
          <div className="col-span-full flex items-center justify-center rounded-2xl border-2 border-dashed border-white/10 py-16">
            <p className="text-base text-white/30">No players found for selected teams.</p>
          </div>
        )}
      </div>
    </div>
  );
}
