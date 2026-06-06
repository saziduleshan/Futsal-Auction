'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import type { Team } from '@/lib/types';

export function EditTeamName({ team, canEdit }: { team: Team; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === team.name) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/teams/update-name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id, name: trimmed })
      });

      if (res.ok) {
        setEditing(false);
      } else {
        const payload = await res.json();
        setError(payload.message || 'Failed to update name.');
      }
    } catch {
      setError('Could not connect.');
    } finally {
      setSaving(false);
    }
  }, [name, team.id, team.name]);

  const handleCancel = useCallback(() => {
    setName(team.name);
    setError(null);
    setEditing(false);
  }, [team.name]);

  if (editing) {
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full max-w-md rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-2xl font-black uppercase tracking-[0.12em] text-gold outline-none backdrop-blur-xl transition focus:border-gold md:text-4xl"
          />
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex size-10 items-center justify-center rounded-xl bg-lime text-black transition hover:bg-lime/90 disabled:opacity-40"
          >
            {saving ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
          </button>
          <button
            onClick={handleCancel}
            className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white/60 transition hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>
        {error ? <p className="mt-2 text-sm font-bold text-rose">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      <h1 className="text-4xl font-black uppercase tracking-[0.12em] text-[#0F2838] drop-shadow-lg md:text-5xl">{name}</h1>
      {canEdit ? (
        <button
          onClick={() => setEditing(true)}
          className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/40 shadow-lg backdrop-blur-xl transition hover:border-gold/40 hover:text-gold"
        >
          <Pencil className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
