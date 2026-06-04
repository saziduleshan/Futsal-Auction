'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2 } from 'lucide-react';

export function TeamAuctionGuard({
  teamId,
  roomId,
  children
}: {
  teamId: string;
  roomId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [rejoining, setRejoining] = useState(false);

  useEffect(() => {
    async function check() {
      const res = await fetch(`/api/auction/participant-status?roomId=${roomId}`);
      const data = await res.json();
      if (data.participantId) {
        setParticipantId(data.participantId);
        setIsConnected(data.connected);
      } else {
        setIsConnected(false);
      }
      setChecking(false);
    }
    check();
  }, [roomId]);

  const handleRejoin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setRejoining(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auction/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setIsConnected(true);
        router.refresh();
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage('Could not connect.');
    } finally {
      setRejoining(false);
    }
  }, [code, router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-md py-20">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-cyan/20">
              <KeyRound className="size-5 text-cyan" />
            </div>
            <div>
              <p className="font-bold text-white">Rejoin auction</p>
              <p className="text-sm text-white/50">You were disconnected. Enter the code to rejoin.</p>
            </div>
          </div>
          <form onSubmit={handleRejoin} className="mt-4 flex gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
              className="w-32 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-center text-lg font-bold tracking-[0.3em] text-white uppercase placeholder:text-sm placeholder:tracking-normal placeholder:text-white/30 backdrop-blur-xl outline-none transition focus:border-cyan"
            />
            <button
              type="submit"
              disabled={code.length !== 6 || rejoining}
              className="flex items-center gap-2 rounded-xl bg-cyan px-6 py-2.5 font-bold text-black transition hover:bg-cyan/90 disabled:opacity-40"
            >
              {rejoining ? <Loader2 className="size-4 animate-spin" /> : null}
              Rejoin
            </button>
          </form>
          {message ? <p className="mt-3 text-sm font-bold text-rose">{message}</p> : null}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
