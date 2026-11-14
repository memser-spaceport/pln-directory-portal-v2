'use client';

import { create } from 'zustand';

interface TopNavState {
  /** True while a page asks to run full page, without the LabOS top navigation. */
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}

/**
 * Lets a page turn off the LabOS top navigation for as long as it is mounted. Used by an AI App an admin set to
 * "hide top navigation" (LAB-3238); every other route keeps the header.
 */
export const useTopNavStore = create<TopNavState>((set) => ({
  hidden: false,
  setHidden: (hidden) => set({ hidden }),
}));

/** Renders the top navigation unless the current page turned it off. */
export function TopNavGate({ children }: { children: React.ReactNode }) {
  const hidden = useTopNavStore((state) => state.hidden);
  if (hidden) return null;
  return <>{children}</>;
}
