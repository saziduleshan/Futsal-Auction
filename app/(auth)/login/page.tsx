'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/Genesisloginbackground.png)' }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 md:p-10">
          <div className="text-center">
            <Image
              src="/Genesislogo.png"
              alt="The Genesis"
              width={240}
              height={80}
              className="mx-auto h-auto w-48 md:w-60"
              priority
            />
          </div>

          <form action="/api/auth/login" method="post" className="mt-8 space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                Username
              </label>
              <input
                id="username"
                name="username"
                required
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-white/40"
                placeholder="mteam1 or admin"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-white/40 focus:border-white/40"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 px-5 py-3 font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white/30">
              <LogIn className="h-5 w-5" />
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
