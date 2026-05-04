import { LogIn, Shield, Users } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-center px-4 py-16 md:px-6">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel p-8 md:p-10">
          <span className="badge">Access portal</span>
          <h1 className="mt-6 text-4xl font-black uppercase tracking-[0.12em] md:text-5xl">Login to the auction arena</h1>
          <p className="mt-4 text-white/70">
            Team users can enter the bidding room and view their purchased roster. Admin users can upload cards, start lots, and close sales.
          </p>
          <div className="mt-8 grid gap-4">
            <div className="glass rounded-2xl p-4">
              <Shield className="h-5 w-5 text-lime" />
              <p className="mt-3 font-bold uppercase tracking-[0.12em]">Admin access</p>
              <p className="mt-2 text-sm text-white/65">Create players, upload card art, manage live rooms, and assign sold players automatically.</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <Users className="h-5 w-5 text-cyan" />
              <p className="mt-3 font-bold uppercase tracking-[0.12em]">Team access</p>
              <p className="mt-2 text-sm text-white/65">Place bids in your own division and track your current purse plus purchased players.</p>
            </div>
          </div>
        </div>

        <div className="panel p-8 md:p-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-pitch">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-black uppercase tracking-[0.12em]">Sign in</h2>
          <form action="/api/auth/login" method="post" className="mt-8 space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                Username
              </label>
              <input
                id="username"
                name="username"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-cyan/50"
                placeholder="team-men-1 or admin"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-cyan/50"
                placeholder="••••••••"
              />
            </div>
            <button className="w-full rounded-2xl bg-lime px-5 py-3 font-black uppercase tracking-[0.18em] text-pitch transition hover:bg-white">
              Login to dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
