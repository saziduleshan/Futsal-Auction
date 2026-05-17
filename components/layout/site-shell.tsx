import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, LogOut, Shield, Swords } from 'lucide-react';
import { getSession } from '@/lib/auth';

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-brazil-blue/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/joga-bonito-logo.png"
              alt="Joga Bonito"
              width={200}
              height={60}
              className="h-12 w-auto brightness-0 invert"
              priority
            />
          </Link>

          <nav className="flex items-center gap-2 text-sm font-semibold text-white/80">
            <Link href="/auction" className="rounded-full border border-white/15 px-4 py-2 transition hover:border-gold hover:text-gold">
              <span className="inline-flex items-center gap-2"><Swords className="h-4 w-4" />Live Auction</span>
            </Link>
            {session?.role === 'admin' ? (
              <>
                <Link href="/admin/players" className="rounded-full border border-white/15 px-4 py-2 transition hover:border-gold hover:text-gold">
                  <span className="inline-flex items-center gap-2"><Shield className="h-4 w-4" />Players</span>
                </Link>
                <Link href="/admin" className="rounded-full border border-white/15 px-4 py-2 transition hover:border-gold hover:text-gold">
                  <span className="inline-flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />Admin</span>
                </Link>
              </>
            ) : null}
            {session?.teamId ? (
              <Link href="/teams/me" className="rounded-full border border-white/15 px-4 py-2 transition hover:border-gold hover:text-gold">
                <span className="inline-flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />My Team</span>
              </Link>
            ) : null}
            {session ? (
              <form action="/api/auth/logout" method="post">
                <button className="rounded-full bg-white/10 px-4 py-2 font-bold text-white transition hover:bg-white/20">
                  <span className="inline-flex items-center gap-2"><LogOut className="h-4 w-4" />Logout</span>
                </button>
              </form>
            ) : (
              <Link href="/login" className="rounded-full bg-white/10 px-4 py-2 font-bold text-white transition hover:bg-white/20">
                <span className="inline-flex items-center gap-2">Login</span>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
