# Berkerja Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase email/password authentication with login, register, and sign-out flows, replacing the current UUID-in-header demo auth.

**Architecture:** Supabase Auth via `@supabase/ssr` handles sessions as HTTP-only cookies. Server-side `createClient()` reads auth state on each request. Client-side `useUserContextStore` replaced by Supabase's `onAuthStateChange` listener.

**Tech Stack:** Supabase Auth, `@supabase/ssr`, Next.js App Router, Tailwind CSS, Zustand

---

## File Structure

```
src/
├── app/(auth)/
│   ├── login/page.tsx          # Sign-in page
│   └── register/page.tsx        # Sign-up page
├── app/(dashboard)/
│   ├── layout.tsx               # Add auth check + UserBadge
│   ├── cv/page.tsx              # Remove UUID input, use supabase auth
│   ├── keywords/page.tsx       # Remove UUID input, use supabase auth
│   └── jobs/page.tsx            # Remove UUID input, use supabase auth
├── components/
│   ├── auth/
│   │   ├── AuthForm.tsx         # Shared login/register form
│   │   └── UserBadge.tsx        # Shows email + sign-out button
│   └── layout/
│       └── header.tsx           # Replace UUID input with UserBadge
├── lib/
│   └── supabase/
│       ├── client.ts            # Add onAuthStateChange listener
│       └── server.ts            # Already correct, keep as-is
├── stores/
│   └── auth-store.ts             # Zustand store for auth state
└── types/
    └── user.ts                  # User type definition
```

---

## Task 1: Auth Store

**Files:**
- Create: `src/stores/auth-store.ts`
- Test: `src/stores/auth-store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/stores/auth-store';

// Mock supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      }),
    },
  }),
}));

describe('useAuthStore', () => {
  it('initializes with loading false', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.loading).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/auth-store.test.ts`
Expected: FAIL — file not found

- [ ] **Step 3: Write minimal implementation**

```ts
// src/stores/auth-store.ts
import { create } from 'zustand';

interface AuthState {
  user: { id: string; email: string } | null;
  loading: boolean;
  setUser: (user: AuthState['user']) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/auth-store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/stores/auth-store.ts src/stores/auth-store.test.ts
git commit -m "feat: add auth store"
```

---

## Task 2: UserBadge Component

**Files:**
- Create: `src/components/auth/UserBadge.tsx`
- Modify: `src/components/layout/header.tsx` — replace UUID input with UserBadge

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/auth/UserBadge.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserBadge } from '@/components/auth/UserBadge';

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
    },
  }),
}));

describe('UserBadge', () => {
  it('shows email when user is authenticated', () => {
    render(<UserBadge user={{ id: '123', email: 'test@example.com' }} />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls signOut when sign out button is clicked', async () => {
    const user = userEvent.setup();
    const { signOut } = useAuthStore.getState();
    render(<UserBadge user={{ id: '123', email: 'test@example.com' }} />);
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(signOut).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/auth/UserBadge.test.tsx`
Expected: FAIL — file not found

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/auth/UserBadge.tsx
'use client';

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
```

- [ ] **Step 4: Update header to use UserBadge**

```tsx
// src/components/layout/header.tsx — replace the UUID input section with:
{user ? (
  <UserBadge user={user} />
) : (
  <div className="h-8 w-8 rounded-full bg-slate-200" />
)}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/components/auth/UserBadge.test.tsx`
Expected: PASS (may need mock setup adjustments based on actual testing-library usage)

- [ ] **Step 6: Commit**

```bash
git add src/components/auth/UserBadge.tsx src/components/layout/header.tsx
git commit -m "feat: add UserBadge component and wire to header"
```

---

## Task 3: AuthForm Component

**Files:**
- Create: `src/components/auth/AuthForm.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/auth/AuthForm.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from '@/components/auth/AuthForm';

const onSubmit = vi.fn();

describe('AuthForm', () => {
  it('renders email and password inputs', () => {
    render(<AuthForm mode="login" onSubmit={onSubmit} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('calls onSubmit with email and password on submit', async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('shows confirm password field in register mode', () => {
    render(<AuthForm mode="register" onSubmit={onSubmit} />);
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows error message when error prop is set', () => {
    render(<AuthForm mode="login" onSubmit={onSubmit} error="Invalid credentials" />);
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('disables submit button while loading', () => {
    render(<AuthForm mode="login" onSubmit={onSubmit} isLoading={true} />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/auth/AuthForm.test.tsx`
Expected: FAIL — file not found

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/auth/AuthForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function AuthForm({ mode, onSubmit, isLoading, error }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (mode === 'register' && password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await onSubmit({ email, password });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {(error || localError) && (
            <p className="text-sm text-red-600">{error || localError}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>

          <p className="text-sm text-center text-slate-500">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <Link href="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/auth/AuthForm.test.tsx`
Expected: PASS (adjust mocks as needed)

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/AuthForm.tsx src/components/auth/AuthForm.test.tsx
git commit -m "feat: add AuthForm component for login/register"
```

---

## Task 4: Login Page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/layout.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/(auth)/login/page.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginPage } from '@/app/(auth)/login/page';

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      }),
    },
  }),
}));

describe('LoginPage', () => {
  it('renders email and password form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows link to register page', () => {
    render(<LoginPage />);
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/(auth)/login/page.test.tsx`
Expected: FAIL — file not found

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/app/(auth)/login/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  async function handleSubmit({ email, password }: { email: string; password: string }) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

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
          <h1 className="text-3xl font-semibold text-slate-950">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to your Berkerja account</p>
        </div>
        <AuthForm mode="login" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
```

```tsx
// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/(auth)/login/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(auth)/login/page.tsx src/app/(auth)/layout.tsx
git commit -m "feat: add login page"
```

---

## Task 5: Register Page

**Files:**
- Create: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/(auth)/register/page.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RegisterPage } from '@/app/(auth)/register/page';

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: 'new-123', email: 'new@example.com' } },
        error: null,
      }),
    },
  }),
}));

describe('RegisterPage', () => {
  it('renders register form with confirm password', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows link to login page', () => {
    render(<RegisterPage />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/(auth)/register/page.test.tsx`
Expected: FAIL — file not found

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/app/(auth)/register/page.tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/(auth)/register/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(auth)/register/page.tsx
git commit -m "feat: add register page"
```

---

## Task 6: Dashboard Auth Check

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx` — add auth state initialization + redirect

- [ ] **Step 1: Read current layout**

Read: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 2: Write the failing test**

```tsx
// src/app/(dashboard)/layout.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DashboardLayout } from '@/app/(dashboard)/layout';

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
      }),
    },
  }),
}));

describe('DashboardLayout', () => {
  it('redirects to login when not authenticated', () => {
    // Test that layout handles unauthenticated state
    // Actual redirect testing may require next-router-mock
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/app/(dashboard)/layout.test.tsx`
Expected: FAIL or skip (integration test)

- [ ] **Step 4: Modify layout to check auth on mount**

```tsx
// src/app/(dashboard)/layout.tsx
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
    return null; // or loading state while redirecting
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
```

- [ ] **Step 5: Run build to verify it compiles**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 6: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat: add auth check to dashboard layout"
```

---

## Task 7: Remove UUID Header Input

**Files:**
- Modify: `src/components/layout/header.tsx` — remove `useUserContextStore`, add `useAuthStore`

- [ ] **Step 1: Read current header**

Read: `src/components/layout/header.tsx`

- [ ] **Step 2: Write the failing test**

```tsx
// src/components/layout/header.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/header';

// Mock auth store with user
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: '123', email: 'test@example.com' },
    hydrate: vi.fn(),
  })),
}));

describe('Header', () => {
  it('shows user email instead of UUID input', () => {
    render(<Header />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/user uuid/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/components/layout/header.test.tsx`
Expected: FAIL or adjustment needed

- [ ] **Step 4: Rewrite header using auth store**

Replace `useUserContextStore` with `useAuthStore`. Replace UUID input with `UserBadge`.

```tsx
// src/components/layout/header.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { UserBadge } from '@/components/auth/UserBadge';

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
        {user ? <UserBadge user={user} /> : <div className="h-8 w-32 rounded bg-slate-100 animate-pulse" />}
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Run build to verify it compiles**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: replace UUID header with UserBadge auth"
```

---

## Task 8: Update CV Page to Use Auth

**Files:**
- Modify: `src/app/(dashboard)/cv/page.tsx`

- [ ] **Step 1: Read current CV page**

Read: `src/app/(dashboard)/cv/page.tsx`

- [ ] **Step 2: Remove UUID input usage, use auth store instead**

Replace `useUserContextStore` with `useAuthStore` for userId.

```tsx
// Update the imports and hook usage:
// import { useAuthStore } from '@/stores/auth-store';
// const { userId } = useAuthStore();
// ... use userId instead of previous userId from store
```

The page logic stays the same — it already uses `userId` from a store — just swap the store source.

- [ ] **Step 3: Run build to verify it compiles**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/cv/page.tsx
git commit -m "feat: update CV page to use auth store"
```

---

## Task 9: Update Keywords Page to Use Auth

**Files:**
- Modify: `src/app/(dashboard)/keywords/page.tsx`

- [ ] **Step 1: Read current keywords page**

Read: `src/app/(dashboard)/keywords/page.tsx`

- [ ] **Step 2: Replace useUserContextStore with useAuthStore**

- [ ] **Step 3: Run build to verify it compiles**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/keywords/page.tsx
git commit -m "feat: update keywords page to use auth store"
```

---

## Task 10: Update Jobs Page to Use Auth

**Files:**
- Modify: `src/app/(dashboard)/jobs/page.tsx`

- [ ] **Step 1: Read current jobs page**

Read: `src/app/(dashboard)/jobs/page.tsx`

- [ ] **Step 2: Replace useUserContextStore with useAuthStore**

- [ ] **Step 3: Run build to verify it compiles**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/jobs/page.tsx
git commit -m "feat: update jobs page to use auth store"
```

---

## Task 11: Delete Old user-context Store

**Files:**
- Delete: `src/stores/user-context.ts`

- [ ] **Step 1: Ensure no remaining references**

Run: `grep -r "useUserContextStore" src/ --include="*.ts" --include="*.tsx"`

Expected: No results

- [ ] **Step 2: Delete file**

```bash
git rm src/stores/user-context.ts
git commit -m "chore: remove old user-context store"
```

---

## Verification Checklist

- [ ] All 7 tests pass
- [ ] Build succeeds with no errors
- [ ] Login page renders at `/login`
- [ ] Register page renders at `/register`
- [ ] Unauthenticated user redirected to `/login` when visiting `/cv`
- [ ] UserBadge shows email and sign-out button
- [ ] `user-context.ts` deleted