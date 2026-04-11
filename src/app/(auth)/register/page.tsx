'use client';

import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  async function handleSubmit({ email, password }: { email: string; password: string }) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) throw error;

    if (data.user) {
      setUser({ id: data.user.id, email: data.user.email ?? email });
      router.push('/cv');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Create account</h1>
          <p className="mt-2 text-sm text-slate-500">Sign up to start your job search</p>
        </div>
        <AuthForm mode="register" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
