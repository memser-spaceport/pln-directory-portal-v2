import { create } from 'zustand';

interface UserState {
  readonly profileImage: string | null;
  readonly actions: {
    setProfileImage: (url: string | null) => void;
  };
}

export const useUserStore = create<UserState>((set) => ({
  profileImage: null,
  actions: {
    setProfileImage: (url) => set({ profileImage: url }),
  },
})); 