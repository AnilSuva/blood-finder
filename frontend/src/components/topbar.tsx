'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { Droplet, MapPin, Plus, User as UserIcon } from 'lucide-react';

export function Topbar() {
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User }>('/me'),
  });

  const user = data?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-2.5 transition">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blood-600 to-blood-800 text-white shadow-md shadow-blood-700/25 group-hover:scale-105 transition-transform">
            <Droplet className="h-5 w-5 fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-slate-950 flex items-center gap-0.5">
              Blood<span className="text-blood-600">Finder</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 -mt-1 hidden sm:block">
              Emergency Network
            </span>
          </div>
        </Link>

        {/* User Context & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user?.city && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs">
              <MapPin className="h-3.5 w-3.5 text-blood-600" />
              <span>{user.city.replaceAll('-', ' ')}</span>
            </div>
          )}

          {user && (
            <Link
              href="/profile"
              className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 shadow-xs transition"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  user.available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              />
              <span>{user.available ? 'Donor Active' : 'Away'}</span>
            </Link>
          )}

          <Link
            href="/request/new"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blood-600 to-blood-700 hover:from-blood-700 hover:to-blood-800 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blood-600/20 active:scale-[0.98] transition"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">Request Blood</span>
            <span className="inline xs:hidden sm:hidden">Request</span>
          </Link>

          <Link
            href="/profile"
            aria-label="Open donor profile"
            className="group relative flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blood-600 focus:ring-offset-2 transition shadow-xs"
          >
            {user?.name ? (
              <span className="font-extrabold text-sm text-slate-800">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
            ) : (
              <UserIcon className="h-4 w-4 text-slate-600" />
            )}

            {user?.bloodGroup && (
              <span className="absolute -bottom-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-blood-600 text-[9px] font-black text-white ring-2 ring-white">
                {user.bloodGroup}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
