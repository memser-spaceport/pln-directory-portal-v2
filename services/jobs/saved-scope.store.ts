import { create } from 'zustand';

interface SavedScopeStore {
  savedScope: boolean;
  setSavedScope: (savedScope: boolean) => void;
}

export const useSavedScopeStore = create<SavedScopeStore>((set) => ({
  savedScope: false,
  setSavedScope: (savedScope) => set({ savedScope }),
}));
