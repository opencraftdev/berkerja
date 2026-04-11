'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

interface UserBadgeProps {
  user: { id: string; email: string };
}

export function UserBadge({ user }: UserBadgeProps) {
  const router = useRouter();
  const { setUser } = useAuthStore();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600">{user.email}</span>
      <Button type="button" variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}