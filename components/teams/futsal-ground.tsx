'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import type { Player } from '@/lib/types';

interface Slot {
  x: number;
  y: number;
  label: string;
}

const SLOTS: Slot[] = [
  { x: 50, y: 86, label: 'GK' },
  { x: 25, y: 58, label: 'DEF' },
  { x: 75, y: 58, label: 'DEF' },
  { x: 50, y: 40, label: 'MID' },
  { x: 50, y: 20, label: 'FWD' },
];

export function FutsalGround({ players }: { players: Player[] }) {
  const [pitchPlayers, setPitchPlayers] = useState<(Player | null)[]>(Array(SLOTS.length).fill(null));
  const [bench, setBench] = useState<Player[]>(players);

  const handleDropOnSlot = useCallback((slotIndex: number, playerId: string) => {
    const player = bench.find((p) => p.id === playerId);
    if (!player) return;

    setBench((prev) => prev.filter((p) => p.id !== playerId));
    setPitchPlayers((prev) => {
      const next = [...prev];
      if (next[slotIndex]) {
        setBench((b) => [...b, next[slotIndex]!]);
      }
      next[slotIndex] = player;
      return next;
    });
  }, [bench]);

  const handleRemoveFromSlot = useCallback((slotIndex: number) => {
    setPitchPlayers((prev) => {
      const player = prev[slotIndex];
      if (!player) return prev;
      setBench((b) => [...b, player]);
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  }, []);

  const handleClear = useCallback(() => {
    const allPlayers = pitchPlayers.filter((p): p is Player => p !== null);
    setBench((prev) => [...prev, ...allPlayers]);
    setPitchPlayers(Array(SLOTS.length).fill(null));
  }, [pitchPlayers]);

  const placedCount = pitchPlayers.filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-xl overflow-hidden rounded-2xl bg-gradient-to-b from-green-600 to-green-800 shadow-2xl">
        <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="14" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="1.5" fill="white" fillOpacity="0.3" />
          <rect x="14" y="0" width="72" height="24" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.4" />
          <rect x="14" y="76" width="72" height="24" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.4" />
          <rect x="30" y="0" width="40" height="8" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="0.4" />
          <rect x="30" y="92" width="40" height="8" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="0.4" />
          <rect x="35" y="0" width="30" height="2.5" fill="white" fillOpacity="0.35" rx="0.5" />
          <rect x="35" y="97.5" width="30" height="2.5" fill="white" fillOpacity="0.35" rx="0.5" />
          <path d="M 0 0 Q 4 0 4 4" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.4" />
          <path d="M 100 0 Q 96 0 96 4" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.4" />
          <path d="M 0 100 Q 4 100 4 96" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.4" />
          <path d="M 100 100 Q 96 100 96 96" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.4" />
        </svg>

        {SLOTS.map((slot, index) => {
          const placed = pitchPlayers[index];
          return (
            <div
              key={index}
              className="absolute"
              style={{ left: `${slot.x}%`, top: `${slot.y}%`, transform: 'translate(-50%, -50%)' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('playerId');
                if (id) handleDropOnSlot(index, id);
              }}
              onClick={() => placed && handleRemoveFromSlot(index)}
            >
              {placed ? (
                <div className="group relative flex size-16 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-cyan to-purple p-0.5 shadow-lg ring-2 ring-white/70 transition hover:scale-110">
                  <span className="text-center text-[10px] font-bold leading-tight text-white">
                    {placed.name.split(' ').pop()}
                  </span>
                  <div className="absolute -inset-1 hidden items-center justify-center rounded-full bg-black/60 group-hover:flex">
                    <span className="text-sm text-white/80">✕</span>
                  </div>
                </div>
              ) : (
                <div className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-white/25 bg-white/10 backdrop-blur-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">{slot.label}</span>
                </div>
              )}
            </div>
          );
        })}

        <div className="absolute left-2 top-2 text-[10px] font-bold uppercase tracking-wider text-white/30">
          Attack
        </div>
        <div className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider text-white/30">
          Defence
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white/50">
          Squad{bench.length > 0 && <span className="ml-2 text-white/30">({bench.length} available)</span>}
        </h3>
        <button
          onClick={handleClear}
          disabled={placedCount === 0}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold text-white/60 transition hover:bg-white/10 disabled:opacity-30"
        >
          Clear pitch
        </button>
      </div>

      {players.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="font-bold text-white/40">No players available</p>
          <p className="mt-1 text-sm text-white/20">Purchase players in the auction to build your squad.</p>
        </div>
      ) : bench.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="font-bold text-white/40">All 5 players are on the pitch</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {bench.map((player) => (
            <div
              key={player.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('playerId', player.id)}
              className="flex cursor-grab items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur-xl transition hover:bg-white/[0.12] active:cursor-grabbing"
            >
              {player.card_image_url ? (
                <Image src={player.card_image_url} alt="" width={24} height={30} className="size-6 rounded object-cover" />
              ) : (
                <div className="size-6 rounded bg-gradient-to-br from-cyan/30 to-purple/30" />
              )}
              <span className="text-sm font-bold text-white">{player.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
