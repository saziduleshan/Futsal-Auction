'use client';

import { RefreshCw } from 'lucide-react';

export function ResetTeamsButton({ roomId }: { roomId: string }) {
  return (
    <button
      onClick={async () => {
        if (!confirm('Reset all teams for this auction? This will refund purses and clear all purchases.')) return;
        await fetch('/api/admin/auction/reset-teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId })
        });
        window.location.reload();
      }}
      className="flex items-center gap-2 rounded-xl bg-[#1D3C50] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0F2838]"
    >
      <RefreshCw className="size-4" />
      Reset teams
    </button>
  );
}
