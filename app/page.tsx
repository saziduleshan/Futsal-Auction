'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <>
      <style>{`input::-ms-reveal,input::-ms-clear{display:none}input::-webkit-credentials-auto-fill-button{display:none!important;visibility:hidden;pointer-events:none;width:0;height:0}`}</style>
      <svg className="absolute size-0" aria-hidden>
        <filter id="roughpaper">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" result="noise" numOctaves="5" />
          <feDiffuseLighting in="noise" lighting-color="#A3311C" surfaceScale="2">
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
        </filter>
      </svg>

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/Genesisloginbackground.png)' }}
        />

        <div className="relative z-10 w-full max-w-md px-4">
          <div className="text-center mb-6">
            <Image
              src="/Genesislogo.png"
              alt="The Genesis"
              width={240}
              height={80}
              className="mx-auto h-auto w-48 md:w-60"
              priority
            />
          </div>
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <div className="absolute inset-0" style={{ backgroundColor: '#A3311C', filter: 'url(#roughpaper)' }} />
            <div className="relative rounded-xl bg-black/50 m-2 p-8 backdrop-blur-sm">

              <form action="/api/auth/login" method="post" className="mt-8 space-y-5">
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-bold uppercase tracking-[0.18em] text-white">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    required
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-bold text-white outline-none transition placeholder:text-white/50 focus:border-white/50"
                    placeholder="mteam1 or admin"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-bold uppercase tracking-[0.18em] text-white">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-12 font-bold text-white outline-none transition placeholder:text-white/50 focus:border-white/50"
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
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-black uppercase tracking-[0.18em] text-white transition hover:brightness-125"
                  style={{ backgroundColor: '#1D3C50' }}
                >
                  <LogIn className="h-5 w-5" />
                  Sign in
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
