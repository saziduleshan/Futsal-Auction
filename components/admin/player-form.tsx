'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { YEAR_TIERS, getYearTier } from '@/lib/constants';

export function PlayerForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'final'>(1);

  const tier = getYearTier(selectedYear);

  async function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch('/api/admin/player', {
        method: 'POST',
        body: formData
      });
      const payload = await response.json();
      setMessage(payload.message ?? (response.ok ? 'Player created.' : 'Something went wrong.'));
      if (response.ok) {
        router.refresh();
      }
    });
  }

  return (
    <form action={onSubmit} className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-gray-400/40 p-8 shadow-lg backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="badge border-gold/30 text-gold">Player management</p>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.12em] text-gold">Add player card</h2>
        </div>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Player name</span>
          <input name="name" required className="w-full rounded-2xl border border-white/30 bg-white/70 px-4 py-3 text-gray-900 outline-none backdrop-blur-sm transition focus:border-gold focus:ring-1 focus:ring-gold/30" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Division</span>
          <select name="division" defaultValue="men" className="w-full rounded-2xl border border-white/30 bg-white/70 px-4 py-3 text-gray-900 outline-none backdrop-blur-sm transition focus:border-gold focus:ring-1 focus:ring-gold/30">
            <option value="men">Male Futsal</option>
            <option value="women">Female Futsal</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Position</span>
          <select name="position" defaultValue="defender" className="w-full rounded-2xl border border-white/30 bg-white/70 px-4 py-3 text-gray-900 outline-none backdrop-blur-sm transition focus:border-gold focus:ring-1 focus:ring-gold/30">
            <option value="defender">Defender</option>
            <option value="midfielder">Midfielder</option>
            <option value="forward">Forward</option>
            <option value="goalkeeper">Goalkeeper</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Year</span>
          <select
            name="year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'final' ? 'final' : Number(e.target.value))}
            className="w-full rounded-2xl border border-white/30 bg-white/70 px-4 py-3 text-gray-900 outline-none backdrop-blur-sm transition focus:border-gold focus:ring-1 focus:ring-gold/30"
          >
            {YEAR_TIERS.map((yt) => (
              <option key={String(yt.value)} value={String(yt.value)}>{yt.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Tier</span>
          <div className="flex h-[46px] items-center rounded-2xl border border-gold/20 bg-gold/5 px-4 text-sm font-bold uppercase tracking-[0.12em] text-gold">
            {tier.tier}
          </div>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Base price</span>
          <div className="flex h-[46px] items-center rounded-2xl border border-gold/20 bg-gold/5 px-4 text-xl font-black text-gold">
            ${tier.basePrice}
          </div>
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Player card image</span>
          <input name="image" type="file" accept="image/*" className="block w-full rounded-2xl border border-dashed border-white/30 bg-white/50 px-4 py-4 text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-gold/20 file:px-3 file:py-1 file:text-sm file:text-gold backdrop-blur-sm transition hover:border-gold/40" />
        </label>
      </div>
      <button disabled={isPending} className="mt-8 w-full rounded-2xl bg-gradient-to-r from-gold to-orange px-5 py-3 font-black uppercase tracking-[0.16em] text-white transition hover:from-gray-800 hover:to-gray-800 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400">
        {isPending ? 'Uploading…' : 'Create player'}
      </button>
      {message ? <p className="mt-4 text-sm text-gray-200">{message}</p> : null}
    </form>
  );
}
