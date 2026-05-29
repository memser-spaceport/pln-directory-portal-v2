import { create } from 'zustand';
import type { SubmitIdeaModalVariant } from './submitIdeaModal';

interface SubmitIdeaModalState {
  readonly open: boolean;
  readonly variant: SubmitIdeaModalVariant;
  readonly actions: {
    openModal: (variant?: SubmitIdeaModalVariant) => void;
    closeModal: () => void;
  };
}

export const useSubmitIdeaModalStore = create<SubmitIdeaModalState>((set) => ({
  open: false,
  variant: 'idea',
  actions: {
    openModal: (variant = 'idea') => set({ open: true, variant }),
    closeModal: () => set({ open: false, variant: 'idea' }),
  },
}));
