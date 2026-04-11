import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';

describe('useAuthStore', () => {
  it('initializes with user null and loading false', () => {
    const { user, loading } = useAuthStore.getState();
    expect(user).toBe(null);
    expect(loading).toBe(false);
  });
});