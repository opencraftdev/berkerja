import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserBadge } from '@/components/auth/UserBadge';

const mockSignOut = vi.fn().mockResolvedValue({});

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signOut: mockSignOut,
    },
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('UserBadge', () => {
  it('shows email when user is authenticated', () => {
    render(<UserBadge user={{ id: '123', email: 'test@example.com' }} />);
    expect(document.body.textContent).toContain('test@example.com');
  });

  it('calls signOut when sign out button is clicked', async () => {
    const user = userEvent.setup();
    render(<UserBadge user={{ id: '123', email: 'test@example.com' }} />);
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(mockSignOut).toHaveBeenCalled();
  });
});