'use client';

import { useEffect } from 'react';

import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

export function Header() {
  const { user, setUser, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <header className="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Dashboard</h2>
          <p className="text-sm text-slate-500">
            Use Supabase auth or set a user id here for local testing.
          </p>
        </div>
        <div className="w-full lg:w-[360px]">
          <Input
            value={user?.id || ''}
            onChange={(event) => setUser({ id: event.target.value } as any)}
            placeholder="Paste your Supabase user UUID"
          />
        </div>
      </div>
    </header>
  );
}
