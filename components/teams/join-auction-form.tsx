'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2 } from 'lucide-react';

export function JoinAuctionForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
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
        router.push('/auction');
      } else {
        setMessage(payload.message || 'Failed to join.');
      }
    } catch {
      setMessage('Could not connect.');
    } finally {
      setIsPending(false);
    }
  }, [code, router]);

  return (
    <form onSubmit={handleJoin} className="panel p-8">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan/20 to-purple/20">
          <KeyRound className="size-7 text-cyan" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-black uppercase tracking-[0.12em] text-white">Join auction</p>
          <p className="mt-1 text-sm text-white/50">Enter the 6-character code from the admin.</p>
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="e.g. ABC123"
          maxLength={6}
          className="w-40 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-lg font-bold tracking-[0.3em] text-white uppercase placeholder:text-sm placeholder:tracking-normal placeholder:text-white/30 backdrop-blur-xl outline-none transition focus:border-cyan"
        />
        <button
          type="submit"
          disabled={code.length !== 6 || isPending}
          className="flex items-center gap-2 rounded-xl bg-cyan px-8 py-3 font-bold text-black transition hover:bg-cyan/90 disabled:opacity-40"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Join
        </button>
      </div>
      {message ? (
        <p className="mt-3 text-sm font-bold text-rose">{message}</p>
      ) : null}
    </form>
  );
}
