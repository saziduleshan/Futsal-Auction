'use client';

import { useState } from 'react';
import { Eye, EyeOff, LogIn, Shield, Users } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-center px-4 py-16 md:px-6">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="panel overflow-hidden p-8 md:p-10">
            <div className="relative">
              <span className="badge">Access portal</span>
              <h1 className="mt-6 text-4xl font-black uppercase tracking-[0.12em] md:text-5xl">Login to the auction arena</h1>
              <p className="mt-4 text-gray-500">
                Team users can enter the bidding room and view their purchased roster. Admin users can upload cards, start lots, and close sales.
              </p>
              <div className="mt-8 grid gap-4">
                <div className="rounded-2xl border border-lime/20 bg-gradient-to-br from-lime/[0.08] to-transparent p-4">
                  <Shield className="h-5 w-5 text-lime" />
                  <p className="mt-3 font-bold uppercase tracking-[0.12em]">Admin access</p>
                  <p className="mt-2 text-sm text-gray-500">Create players, upload card art, manage live rooms, and assign sold players automatically.</p>
                </div>
                <div className="rounded-2xl border border-cyan/20 bg-gradient-to-br from-cyan/[0.08] to-transparent p-4">
                  <Users className="h-5 w-5 text-cyan" />
                  <p className="mt-3 font-bold uppercase tracking-[0.12em]">Team access</p>
                  <p className="mt-2 text-sm text-gray-500">Place bids in your own division and track your current purse plus purchased players.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="panel overflow-hidden p-8 md:p-10">
            <div className="relative">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lime to-cyan text-white">
                <LogIn className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-3xl font-black uppercase tracking-[0.12em]">Sign in</h2>
              <form action="/api/auth/login" method="post" className="mt-8 space-y-5">
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    required
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-cyan"
                    placeholder="mteam1 or admin"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-12 text-gray-900 outline-none transition focus:border-cyan"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <button className="w-full rounded-2xl bg-gradient-to-r from-lime to-cyan px-5 py-3 font-black uppercase tracking-[0.18em] text-white transition hover:from-gray-800 hover:to-gray-800">
                  Login to dashboard
                </button>
              </form>
            </div>
          </div>
      </div>
    </div>
  );
}
