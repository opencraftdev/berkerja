import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import RegisterPage from '@/app/(auth)/register/page';

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

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

beforeEach(() => {
  cleanup();
});

describe('RegisterPage', () => {
  it('renders register form with confirm password', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getAllByLabelText(/password/i).length).toBe(2);
    expect(screen.getByLabelText(/confirm password/i)).toBeDefined();
  });

  it('shows link to login page', () => {
    render(<RegisterPage />);
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0);
  });
});
