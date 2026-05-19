'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  MoreVertical, Pencil, Trash2, X, Upload, Loader2,
  Shield, Sparkles, Target, Trophy, Users, Eye, ArrowLeft
} from 'lucide-react';
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

export function PlayerDatabase({ players: initialPlayers }: PlayerDatabaseProps) {
  const [players, setPlayers] = useState(initialPlayers);
  const [activeDivision, setActiveDivision] = useState<Division>('men');
  const [tierFilter, setTierFilter] = useState<PlayerYear | 'all'>('all');
  const [positionFilter, setPositionFilter] = useState<PlayerCategory | 'all'>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deletePlayerId, setDeletePlayerId] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [editYear, setEditYear] = useState<PlayerYear>('1');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openEdit = useCallback((player: Player) => {
    setEditPlayer(player);
    setEditName(player.name);
    setEditYear(player.year);
    setEditImage(null);
    setMenuOpenId(null);
  }, []);

  const closeEdit = useCallback(() => {
    setEditPlayer(null);
    setEditImage(null);
  }, []);

  const openDelete = useCallback((id: string) => {
    setDeletePlayerId(id);
    setMenuOpenId(null);
  }, []);

  const closeDelete = useCallback(() => {
    setDeletePlayerId(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editPlayer) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set('name', editName);
      fd.set('year', editYear);
      if (editImage) fd.set('image', editImage);

      const res = await fetch(`/api/admin/player/${editPlayer.id}`, { method: 'PATCH', body: fd });
      if (!res.ok) throw new Error('Failed to update player');

      const updatedTier = getYearTier(editYear);
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === editPlayer.id
            ? {
                ...p,
                name: editName,
                year: editYear,
                base_price: updatedTier.basePrice,
                card_image_url: editImage ? URL.createObjectURL(editImage) : p.card_image_url
              }
            : p
        )
      );
      closeEdit();
    } catch {
      alert('Failed to update player.');
    } finally {
      setSaving(false);
    }
  }, [editPlayer, editName, editYear, editImage, closeEdit]);

  const handleDelete = useCallback(async () => {
    if (!deletePlayerId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/player/${deletePlayerId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete player');

      setPlayers((prev) => prev.filter((p) => p.id !== deletePlayerId));
      closeDelete();
    } catch {
      alert('Failed to delete player.');
    } finally {
      setDeleting(false);
    }
  }, [deletePlayerId, closeDelete]);

  const divisionPlayers = useMemo(
    () => players.filter((p) => p.division === activeDivision && p.status === 'available'),
    [players, activeDivision]
  );

  const filtered = useMemo(() => {
    return divisionPlayers.filter((p) => {
      if (tierFilter !== 'all' && p.year !== tierFilter) return false;
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
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
          <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${activeDivision === 'men' ? 'bg-white/20' : 'bg-white/20'}`}>
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
          <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${activeDivision === 'women' ? 'bg-white/20' : 'bg-white/20'}`}>
            {womenCount}
          </span>
        </button>
        <span className="text-sm font-bold text-black">
          {players.filter((p) => p.status === 'available').length} total players
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={String(tierFilter)}
          onChange={(e) =>
            setTierFilter(e.target.value === 'all' ? 'all' : (e.target.value as PlayerYear))
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
            onClick={() => { setTierFilter('all'); setPositionFilter('all'); }}
            className="rounded-xl border border-white/20 bg-white/80 px-4 py-3 text-sm font-semibold text-gray-800 backdrop-blur-sm transition hover:border-red-400 hover:text-red-400"
          >
            Clear filters
          </button>
        )}
      </div>

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
            const yearTier = getYearTier(player.year);
            return (
              <article
                key={player.id}
                className="group relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-gray-400/40 shadow-lg backdrop-blur-xl transition hover:shadow-xl hover:-translate-y-0.5"
              >
                <div className="absolute left-3 top-3 z-10" ref={menuOpenId === player.id ? menuRef : undefined}>
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === player.id ? null : player.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/70 opacity-0 backdrop-blur-sm transition hover:bg-black/70 hover:text-white group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpenId === player.id && (
                    <div className="absolute left-0 top-10 w-40 overflow-hidden rounded-xl border border-white/20 bg-gray-900/95 shadow-xl backdrop-blur-xl">
                      <button
                        onClick={() => openEdit(player)}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-gray-200 transition hover:bg-white/10"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit player
                      </button>
                      <button
                        onClick={() => openDelete(player.id)}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-400 transition hover:bg-white/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete player
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative aspect-[4/5]">
                  {player.card_image_url ? (
                    <Image
                      src={player.card_image_url}
                      alt={player.name}
                      width={720}
                      height={900}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold/10 via-brazil-yellow/5 to-orange/10">
                      <div className="text-center">
                        <Icon className="mx-auto h-10 w-10 text-gold/40" />
                        <p className="mt-3 px-4 text-2xl font-black uppercase tracking-[0.1em] text-gray-700">
                          {player.name}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-lg font-black uppercase tracking-[0.08em] text-white drop-shadow-sm">
                      {player.name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1 text-gold">
                        <Icon className="h-3.5 w-3.5" />
                        {formatCategory(player.category)}
                      </span>
                      <span className="rounded-full bg-gold/10 px-2 py-0.5 font-bold text-gold">
                        {yearTier.tier}
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-black text-gold drop-shadow-sm">
                      ${currency(player.base_price)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-gray-900/95 p-8 shadow-xl backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-[0.12em] text-gold">Edit player</h3>
              <button onClick={closeEdit} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/80 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                  Year / Tier
                </label>
                <select
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value as PlayerYear)}
                  className="w-full rounded-xl border border-white/20 bg-white/80 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/30"
                >
                  {YEAR_TIERS.map((yt) => (
                    <option key={String(yt.value)} value={String(yt.value)}>
                      {yt.label} — {yt.tier} (${currency(yt.basePrice)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                  Card image {editImage && <span className="text-gold">(new file selected)</span>}
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/40 px-4 py-3 text-sm text-gray-300 transition hover:border-white/40 hover:bg-white/60">
                  <Upload className="h-4 w-4" />
                  <span>{editImage ? editImage.name : 'Choose a new image (optional)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setEditImage(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeEdit}
                  className="flex-1 rounded-xl border border-white/20 bg-white/70 px-4 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/90"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !editName.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-gray-900 transition hover:bg-gold/90 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletePlayerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-gray-900/95 p-8 shadow-xl backdrop-blur-xl">
            <h3 className="text-lg font-black uppercase tracking-[0.12em] text-red-400">Delete player?</h3>
            <p className="mt-2 text-sm text-gray-400">
              This action cannot be undone. The player will be permanently removed.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={closeDelete}
                className="flex-1 rounded-xl border border-white/20 bg-white/70 px-4 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/90"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
