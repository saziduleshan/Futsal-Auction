import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, LogOut, Shield } from 'lucide-react';
import { getSession } from '@/lib/auth';

export async function SiteShell({ children, bgImage }: { children: React.ReactNode; bgImage?: string }) {
  const session = await getSession();

  return (
    <div className="min-h-screen">
      <div className="relative z-10">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-6">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/Navbarlogo.png"
                alt="The Genesis"
                width={300}
                height={83}
                className="h-14 w-auto"
                priority
              />
            </Link>

              <nav className="flex items-center gap-2 text-sm font-semibold text-white/80">
                {session?.role === 'admin' ? (
                  <>
                    <Link href="/admin/players" className="rounded-full border border-white/15 px-5 py-2.5 transition hover:border-gold hover:text-gold">
                      <span className="inline-flex items-center gap-2"><Shield className="h-4 w-4" />Players</span>
                    </Link>
                    <Link href="/admin" className="rounded-full border border-white/15 px-5 py-2.5 transition hover:border-gold hover:text-gold">
                      <span className="inline-flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />Admin</span>
                    </Link>
                  </>
                ) : null}
                {session?.teamId ? (
                  <Link href="/teams/me" className="rounded-full border border-white/15 px-5 py-2.5 transition hover:border-gold hover:text-gold">
                    <span className="inline-flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />My Team</span>
                  </Link>
                ) : null}
                {session ? (
                  <form action="/api/auth/logout" method="post">
                    <button className="rounded-full bg-white/10 px-5 py-2.5 font-bold text-white transition hover:bg-white/20">
                      <span className="inline-flex items-center gap-2"><LogOut className="h-4 w-4" />Logout</span>
                    </button>
                  </form>
                ) : (
                  <Link href="/login" className="rounded-full bg-white/10 px-5 py-2.5 font-bold text-white transition hover:bg-white/20">
                    <span className="inline-flex items-center gap-2">Login</span>
                  </Link>
                )}
            </nav>
          </div>
        </header>
        <main className="relative min-h-[calc(100vh-97px)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage || '/Allpagebackground.png'})` }}
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
