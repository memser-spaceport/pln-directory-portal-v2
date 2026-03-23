import { create } from 'zustand';

interface SubmitDealModalState {
  readonly open: boolean;
  readonly actions: {
    openModal: () => void;
    closeModal: () => void;
  };
}

export const useSubmitDealModalStore = create<SubmitDealModalState>((set) => ({
  open: false,
  actions: {
    openModal: () => set({ open: true }),
    closeModal: () => set({ open: false }),
  },
}));
