'use client';

import { create } from 'zustand';

const STORAGE_KEY = 'berkerja-user-id';

interface UserContextState {
  userId: string;
  hydrate: () => void;
  setUserId: (userId: string) => void;
}

export const useUserContextStore = create<UserContextState>((set) => ({
  userId: '',
  hydrate: () => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID ?? '';
    set({ userId: stored });
  },
  setUserId: (userId) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, userId);
    }

    set({ userId });
  },
}));
