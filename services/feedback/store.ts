import { create } from 'zustand';

/**
 * The LabOS-wide feedback drawer (LAB-2879). One drawer is mounted for the app
 * (`GlobalFeedback` in the root layout); every door to it — the floating button,
 * the (?) menu's Give feedback, `?dialog=giveFeedback` — opens it through here,
 * so only one is ever open.
 */
interface FeedbackDrawerState {
  readonly open: boolean;
  readonly actions: {
    openDrawer: () => void;
    closeDrawer: () => void;
  };
}

export const useFeedbackDrawerStore = create<FeedbackDrawerState>((set) => ({
  open: false,
  actions: {
    openDrawer: () => set({ open: true }),
    closeDrawer: () => set({ open: false }),
  },
}));
