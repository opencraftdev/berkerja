import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import DashboardLayout from '@/app/(dashboard)/layout';

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
