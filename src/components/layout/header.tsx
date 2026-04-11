'use client';

import { useEffect } from 'react';

import { UserBadge } from '@/components/auth/UserBadge';
import { useAuthStore } from '@/stores/auth-store';

export function Header() {
  const { user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <header className="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Dashboard</h2>
          <p className="text-sm text-slate-500">
            Automated job aggregation powered by AI
          </p>
        </div>
        <div>
          {user ? (
            <UserBadge user={user} />
          ) : (
            <div className="h-8 w-8 rounded-full bg-slate-200" />
          )}
        </div>
      </div>
    </header>
  );
}