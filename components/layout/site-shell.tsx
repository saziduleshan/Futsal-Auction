import Link from 'next/link';
import { LayoutDashboard, LogIn, Shield, Swords, Trophy } from 'lucide-react';
import { getSession } from '@/lib/auth';

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-pitch/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan/40 bg-cyan/10 text-cyan shadow-glow">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan">Futsal Auction 2026</p>
              <p className="text-sm text-white/70">World Cup inspired live bidding platform</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm font-semibold text-white/80">
            <Link href="/auction" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-cyan/50 hover:text-white">
              <span className="inline-flex items-center gap-2"><Swords className="h-4 w-4" />Live Auction</span>
            </Link>
            {session?.role === 'admin' ? (
              <Link href="/admin" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-lime/50 hover:text-white">
                <span className="inline-flex items-center gap-2"><Shield className="h-4 w-4" />Admin</span>
              </Link>
            ) : null}
            {session?.teamId ? (
              <Link href="/teams/me" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-magenta/50 hover:text-white">
                <span className="inline-flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />My Team</span>
              </Link>
            ) : null}
            {session ? (
              <form action="/api/auth/logout" method="post">
                <button className="rounded-full bg-white px-4 py-2 font-bold text-pitch transition hover:bg-lime">
                  Logout
                </button>
              </form>
            ) : (
              <Link href="/login" className="rounded-full bg-white px-4 py-2 font-bold text-pitch transition hover:bg-lime">
                <span className="inline-flex items-center gap-2"><LogIn className="h-4 w-4" />Login</span>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
