import { create } from 'zustand';
import { IUserInfo } from '@/types/shared.types';

interface CurrentUserState {
  readonly currentUser: IUserInfo | null;
  readonly isHydrated: boolean;
  readonly isEnrichedByApi: boolean;
  readonly actions: {
    setCurrentUser: (user: IUserInfo | null) => void;
    setCurrentUserFromApi: (user: IUserInfo | null) => void;
  };
}

export const useCurrentUserStore = create<CurrentUserState>((set) => ({
  currentUser: null,
  isHydrated: false,
  isEnrichedByApi: false,
  actions: {
    setCurrentUser: (user) => set({ currentUser: user, isHydrated: true, isEnrichedByApi: false }),
    setCurrentUserFromApi: (user) => set({ currentUser: user, isHydrated: true, isEnrichedByApi: true }),
  },
}));
