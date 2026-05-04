import { create } from 'zustand';
import { IUserInfo } from '@/types/shared.types';

interface CurrentUserState {
  readonly currentUser: IUserInfo | null;
  readonly isHydrated: boolean;
  readonly actions: {
    setCurrentUser: (user: IUserInfo | null) => void;
  };
}

export const useCurrentUserStore = create<CurrentUserState>((set) => ({
  currentUser: null,
  isHydrated: false,
  actions: {
    setCurrentUser: (user) => set({ currentUser: user, isHydrated: true }),
  },
}));
