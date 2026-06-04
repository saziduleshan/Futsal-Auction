'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { generatePaperGradients } from '@/lib/paper-texture';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const paperGradients = generatePaperGradients();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/Genesisloginbackground.png)' }}
      />

      <div className="relative z-10 w-full max-w-2xl px-4">
        <div className="text-center mb-8">
          <Image
            src="/Genesislogo.png"
            alt="The Genesis"
            width={700}
            height={233}
            className="mx-auto h-auto w-72 md:w-[26rem]"
            priority
          />
        </div>

        <div className="relative border-2 border-[#A3311C]/40 shadow-lg overflow-hidden bg-[#A3311C]">
          <div
            className="absolute inset-0"
            style={{
              background: paperGradients,
              backgroundBlendMode: 'difference'
            }}
          />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              filter: 'invert(1)',
              background: paperGradients,
              backgroundBlendMode: 'difference'
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              mixBlendMode: 'overlay',
              backgroundColor: '#A3311C',
              opacity: 0.65
            }}
          />
          <div className="relative z-10 p-8 md:p-10">
            <form action="/api/auth/login" method="post" className="space-y-5">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  required
                  className="w-full rounded-xl border border-white/30 bg-white/20 px-4 py-3 text-white outline-none transition placeholder:text-white/50 focus:border-white/60"
                  placeholder="mteam1 or admin"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full rounded-xl border border-white/30 bg-white/20 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-white/50 focus:border-white/60"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black/80"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-black uppercase tracking-[0.18em] text-white transition hover:bg-orange-600">
                <LogIn className="h-5 w-5" />
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
