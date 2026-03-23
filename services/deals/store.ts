import { create } from 'zustand';

interface SubmitDealModalState {
  readonly open: boolean;
  readonly successOpen: boolean;
  readonly actions: {
    openModal: () => void;
    closeModal: () => void;
    showSuccess: () => void;
    closeSuccess: () => void;
  };
}

export const useSubmitDealModalStore = create<SubmitDealModalState>((set) => ({
  open: false,
  successOpen: false,
  actions: {
    openModal: () => set({ open: true }),
    closeModal: () => set({ open: false }),
    showSuccess: () => set({ open: false, successOpen: true }),
    closeSuccess: () => set({ successOpen: false }),
  },
}));
