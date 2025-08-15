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

interface FilterState {
  params: URLSearchParams;
  setParam: (key: string, value?: string) => void;
  clearParams: () => void;
  setAllParams: (params: URLSearchParams) => void;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  params: new URLSearchParams(),
  setParam: (key, value) => {
    const next = new URLSearchParams(get().params);
    if (value === undefined) next.delete(key);
    else next.set(key, value);
    set({ params: next });
  },
  clearParams: () => set({ params: new URLSearchParams() }),
  setAllParams: (params) => set({ params }),
}));
