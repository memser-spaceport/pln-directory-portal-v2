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

interface ReportProblemModalState {
  readonly open: boolean;
  readonly dealUid: string | null;
  readonly actions: {
    openModal: (dealUid: string) => void;
    closeModal: () => void;
  };
}

export const useReportProblemModalStore = create<ReportProblemModalState>((set) => ({
  open: false,
  dealUid: null,
  actions: {
    openModal: (dealUid: string) => set({ open: true, dealUid }),
    closeModal: () => set({ open: false, dealUid: null }),
  },
}));

interface RequestDealModalState {
  readonly open: boolean;
  readonly actions: {
    openModal: () => void;
    closeModal: () => void;
  };
}

export const useRequestDealModalStore = create<RequestDealModalState>((set) => ({
  open: false,
  actions: {
    openModal: () => set({ open: true }),
    closeModal: () => set({ open: false }),
  },
}));
