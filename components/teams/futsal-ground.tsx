'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import type { Player } from '@/lib/types';

interface FormationSlot {
  x: number;
  y: number;
  label: string;
}

interface Formation {
  name: string;
  slots: FormationSlot[];
}

const FORMATIONS: Record<string, Formation> = {
  '1-2-1': {
    name: 'Diamond (1-2-1)',
    slots: [
      { x: 50, y: 85, label: 'GK' },
      { x: 30, y: 58, label: 'DEF' },
      { x: 70, y: 58, label: 'DEF' },
      { x: 50, y: 28, label: 'FWD' },
    ],
  },
  '2-2': {
    name: 'Square (2-2)',
    slots: [
      { x: 50, y: 85, label: 'GK' },
      { x: 25, y: 60, label: 'DEF' },
      { x: 75, y: 60, label: 'DEF' },
      { x: 30, y: 32, label: 'FWD' },
      { x: 70, y: 32, label: 'FWD' },
    ],
  },
  '2-1-1': {
    name: 'Y-Shape (2-1-1)',
    slots: [
      { x: 50, y: 85, label: 'GK' },
      { x: 25, y: 60, label: 'DEF' },
      { x: 75, y: 60, label: 'DEF' },
      { x: 50, y: 42, label: 'MID' },
      { x: 50, y: 20, label: 'FWD' },
    ],
  },
  '1-3': {
    name: 'Box (1-3)',
    slots: [
      { x: 50, y: 85, label: 'GK' },
      { x: 50, y: 58, label: 'DEF' },
      { x: 25, y: 34, label: 'FWD' },
      { x: 50, y: 28, label: 'FWD' },
      { x: 75, y: 34, label: 'FWD' },
    ],
  },
  '3-1': {
    name: 'Three Back (3-1)',
    slots: [
      { x: 50, y: 85, label: 'GK' },
      { x: 20, y: 58, label: 'DEF' },
      { x: 50, y: 55, label: 'DEF' },
      { x: 80, y: 58, label: 'DEF' },
      { x: 50, y: 22, label: 'FWD' },
    ],
  },
};

export function FutsalGround({ players }: { players: Player[] }) {
  const [formationKey, setFormationKey] = useState('1-2-1');
  const [pitchPlayers, setPitchPlayers] = useState<(Player | null)[]>([]);
  const [bench, setBench] = useState<Player[]>(players);

  const formation = FORMATIONS[formationKey];

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

  const handleAutoArrange = useCallback(() => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const newPitch: (Player | null)[] = [];
    const newBench: Player[] = [];
    const slotCount = formation.slots.length;
    const assignCount = Math.min(slotCount, shuffled.length);

    for (let i = 0; i < slotCount; i++) {
      newPitch[i] = i < assignCount ? shuffled[i] : null;
    }
    for (let i = assignCount; i < shuffled.length; i++) {
      newBench.push(shuffled[i]);
    }

    setPitchPlayers(newPitch);
    setBench(newBench);
  }, [players, formation]);

  const handleClear = useCallback(() => {
    const allPlayers = pitchPlayers.filter((p): p is Player => p !== null);
    setBench((prev) => [...prev, ...allPlayers]);
    setPitchPlayers([]);
  }, [pitchPlayers]);

  const handleFormationChange = useCallback((key: string) => {
    setFormationKey(key);
    const allPlayers = pitchPlayers.filter((p): p is Player => p !== null);
    setBench((prev) => [...prev, ...allPlayers]);
    setPitchPlayers([]);
  }, [pitchPlayers]);

  const placedCount = pitchPlayers.filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={formationKey}
          onChange={(e) => handleFormationChange(e.target.value)}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 font-bold text-white backdrop-blur-xl"
        >
          {Object.entries(FORMATIONS).map(([key, f]) => (
            <option key={key} value={key}>{f.name}</option>
          ))}
        </select>
        <button
          onClick={handleAutoArrange}
          disabled={players.length === 0}
          className="rounded-xl bg-cyan px-5 py-2.5 font-bold text-black transition hover:bg-cyan/90 disabled:opacity-40"
        >
          Auto-arrange
        </button>
        <button
          onClick={handleClear}
          disabled={placedCount === 0}
          className="rounded-xl border border-white/20 px-5 py-2.5 font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-40"
        >
          Clear
        </button>
        <span className="ml-auto text-sm text-white/40">
          {placedCount} / {formation.slots.length} on pitch
        </span>
      </div>

      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-b from-green-600 to-green-800 shadow-2xl">
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

        {formation.slots.map((slot, index) => {
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
                <div className="group relative flex size-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-cyan to-purple p-0.5 shadow-lg ring-2 ring-white/60 transition hover:scale-110">
                  <span className="text-center text-[9px] font-bold leading-tight text-white">
                    {placed.name.split(' ').pop()}
                  </span>
                  <div className="absolute -inset-1 hidden items-center justify-center rounded-full bg-black/60 group-hover:flex">
                    <span className="text-sm text-white/80">✕</span>
                  </div>
                </div>
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full border-2 border-dashed border-white/25 bg-white/10 backdrop-blur-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{slot.label}</span>
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

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.15em] text-white/50">
          Squad{bench.length > 0 && <span className="ml-2 text-white/30">({bench.length} available)</span>}
        </h3>
        {players.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.03] p-12 text-center">
            <p className="text-lg font-bold text-white/40">No players available</p>
            <p className="mt-2 text-sm text-white/20">Purchase players in the auction to build your squad.</p>
          </div>
        ) : bench.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="font-bold text-white/40">All players are on the pitch</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {bench.map((player) => (
              <div
                key={player.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('playerId', player.id)}
                className="flex cursor-grab items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 backdrop-blur-xl transition hover:bg-white/[0.12] active:cursor-grabbing"
              >
                {player.card_image_url ? (
                  <Image src={player.card_image_url} alt="" width={32} height={40} className="size-8 rounded-lg object-cover" />
                ) : (
                  <div className="size-8 rounded-lg bg-gradient-to-br from-cyan/30 to-purple/30" />
                )}
                <div>
                  <p className="text-sm font-bold text-white">{player.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
