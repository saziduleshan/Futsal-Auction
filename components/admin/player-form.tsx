'use client';

import { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
export function PlayerForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch('/api/admin/player', {
        method: 'POST',
        body: formData
      });
      const payload = await response.json();
      setMessage(payload.message ?? (response.ok ? 'Player created.' : 'Something went wrong.'));
      if (response.ok) {
        formRef.current?.reset();
        router.refresh();
      }
    } catch {
      setMessage('Network error — could not reach server.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-black/60 p-8 shadow-lg backdrop-blur-xl">
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
        <div className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Base price ($)</span>
          <input name="base_price" type="number" min={10} step={10} defaultValue={50} className="w-full rounded-2xl border border-white/30 bg-white/70 px-4 py-3 text-gray-900 outline-none backdrop-blur-sm transition focus:border-gold focus:ring-1 focus:ring-gold/30" />
        </div>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Player card image</span>
          <input name="image" type="file" accept="image/*" className="block w-full rounded-2xl border border-dashed border-white/30 bg-white/50 px-4 py-4 text-sm text-black file:mr-3 file:rounded-full file:border-0 file:bg-gray-800 file:px-3 file:py-1 file:text-sm file:text-white backdrop-blur-sm transition hover:border-gold/40" />
        </label>
      </div>
      <button disabled={isPending} className="mt-8 w-full rounded-2xl bg-[#1D3C50] px-5 py-3 font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#0F2838] disabled:bg-gray-600 disabled:text-gray-400">
        {isPending ? 'Uploading…' : 'Create player'}
      </button>
      {message ? <p className="mt-4 text-sm text-gray-200">{message}</p> : null}
    </form>
  );
}