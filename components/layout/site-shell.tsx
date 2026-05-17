import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, LogOut, Shield, Swords } from 'lucide-react';
import { getSession } from '@/lib/auth';

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/joga-bonito-logo.png"
              alt="Joga Bonito"
              width={140}
              height={44}
              className="h-9 w-auto"
              priority
            />
          </Link>

          <nav className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Link href="/auction" className="rounded-full border border-gray-200 px-4 py-2 transition hover:border-gray-400 hover:text-gray-900">
              <span className="inline-flex items-center gap-2"><Swords className="h-4 w-4" />Live Auction</span>
            </Link>
            {session?.role === 'admin' ? (
              <>
                <Link href="/admin/players" className="rounded-full border border-gray-200 px-4 py-2 transition hover:border-gold hover:text-gold">
                  <span className="inline-flex items-center gap-2"><Shield className="h-4 w-4" />Players</span>
                </Link>
                <Link href="/admin" className="rounded-full border border-gray-200 px-4 py-2 transition hover:border-orange-400 hover:text-orange-600">
                  <span className="inline-flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />Admin</span>
                </Link>
              </>
            ) : null}
            {session?.teamId ? (
              <Link href="/teams/me" className="rounded-full border border-gray-200 px-4 py-2 transition hover:border-purple-400 hover:text-purple-600">
                <span className="inline-flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />My Team</span>
              </Link>
            ) : null}
            {session ? (
              <form action="/api/auth/logout" method="post">
                <button className="rounded-full bg-gray-900 px-4 py-2 font-bold text-white transition hover:bg-gray-700">
                  <span className="inline-flex items-center gap-2"><LogOut className="h-4 w-4" />Logout</span>
                </button>
              </form>
            ) : (
              <Link href="/login" className="rounded-full bg-gray-900 px-4 py-2 font-bold text-white transition hover:bg-gray-700">
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
