'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

const PUBLIC_PATHS = ['/login', '/register'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, setLoading, loading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? '' });
      }
      
      setLoading(false);
      setInitialized(true);
    }

    checkAuth();
  }, [setUser, setLoading]);

  useEffect(() => {
    if (!initialized || loading) return;
    
    if (!user && !PUBLIC_PATHS.includes(pathname)) {
      router.push('/login');
    }
  }, [user, initialized, loading, pathname, router]);

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
