'use client';

import { useState, useCallback } from 'react';
import { KeyRound, Loader2, Check } from 'lucide-react';

export function JoinAuctionForm({ teamId }: { teamId: string }) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleJoin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsPending(true);

    try {
      const res = await fetch('/api/auction/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      });
      const payload = await res.json();
      if (res.ok) {
        setSuccess(true);
        setMessage(payload.message || 'Joined!');
      } else {
        setMessage(payload.message || 'Failed to join.');
      }
    } catch {
      setMessage('Could not connect.');
    } finally {
      setIsPending(false);
    }
  }, [code]);

  if (success) {
    return (
      <div className="rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/[0.08] to-transparent p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-lime/20">
            <Check className="size-5 text-lime" />
          </div>
          <div>
            <p className="font-bold text-lime">Joined auction</p>
            <p className="text-sm text-white/50">You can now access the live auction room.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleJoin} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-cyan/20">
          <KeyRound className="size-5 text-cyan" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-white">Join auction</p>
          <p className="text-sm text-white/50">Enter the 6-character code from the admin.</p>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="e.g. ABC123"
          maxLength={6}
          className="w-32 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-center text-lg font-bold tracking-[0.3em] text-white uppercase placeholder:text-sm placeholder:tracking-normal placeholder:text-white/30 backdrop-blur-xl outline-none transition focus:border-cyan"
        />
        <button
          type="submit"
          disabled={code.length !== 6 || isPending}
          className="flex items-center gap-2 rounded-xl bg-cyan px-6 py-2.5 font-bold text-black transition hover:bg-cyan/90 disabled:opacity-40"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Join
        </button>
      </div>
      {message ? (
        <p className={`mt-3 text-sm font-bold ${success ? 'text-lime' : 'text-rose'}`}>{message}</p>
      ) : null}
    </form>
  );
}
