'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function PlayerForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

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
    <form action={onSubmit} className="panel p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="badge">Player management</p>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.12em]">Add player card</h2>
        </div>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Player name</span>
          <input name="name" required className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan/50" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Division</span>
          <select name="division" defaultValue="men" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan/50">
            <option value="men">Male Futsal</option>
            <option value="women">Female Futsal</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Category</span>
          <select name="category" defaultValue="defender" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan/50">
            <option value="defender">Defender</option>
            <option value="midfielder">Midfielder</option>
            <option value="forward">Forward</option>
            <option value="goalkeeper">Goalkeeper</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Base price</span>
          <input name="basePrice" type="number" min="0" required className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan/50" />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Player card image</span>
          <input name="image" type="file" accept="image/*" className="block w-full rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-white/65" />
        </label>
      </div>
      <button disabled={isPending} className="mt-8 rounded-2xl bg-lime px-5 py-3 font-black uppercase tracking-[0.16em] text-pitch transition hover:bg-white disabled:bg-white/10 disabled:text-white/40">
        {isPending ? 'Uploading…' : 'Create player'}
      </button>
      {message ? <p className="mt-4 text-sm text-white/70">{message}</p> : null}
    </form>
  );
}
