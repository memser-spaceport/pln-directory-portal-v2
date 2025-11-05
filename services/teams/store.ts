import { create } from 'zustand';

interface TeamsFilterState {
  params: URLSearchParams;
  setParam: (key: string, value?: string) => void;
  clearParams: () => void;
  setAllParams: (params: URLSearchParams) => void;
  _clearImmediate: boolean; // Internal flag to signal immediate clear
}

// Store analytics callback outside of Zustand state to avoid re-renders
let analyticsCallback: ((params: URLSearchParams) => void) | undefined;
let analyticsDebounceTimer: NodeJS.Timeout | undefined;

export const setTeamsFilterAnalyticsCallback = (callback: (params: URLSearchParams) => void) => {
  analyticsCallback = callback;
};

// Debounced analytics call to ensure it only fires once per batch of changes
const callAnalyticsDebounced = (params: URLSearchParams) => {
  if (analyticsDebounceTimer) {
    clearTimeout(analyticsDebounceTimer);
  }

  analyticsDebounceTimer = setTimeout(() => {
    if (analyticsCallback) {
      analyticsCallback(params);
    }
  }, 300); // 300ms debounce
};

export const useTeamsFilterStore = create<TeamsFilterState>((set, get) => ({
  params: new URLSearchParams(),
  _clearImmediate: false,
  setParam: (key, value) => {
    const next = new URLSearchParams(get().params);
    if (value === undefined) next.delete(key);
    else next.set(key, value);
    set({ params: next, _clearImmediate: false });

    // Call analytics callback with debounce
    callAnalyticsDebounced(next);
  },
  clearParams: () => {
    const next = new URLSearchParams();
    set({ params: next, _clearImmediate: true });

    // Call analytics callback immediately for clear (no debounce)
    if (analyticsCallback) {
      if (analyticsDebounceTimer) {
        clearTimeout(analyticsDebounceTimer);
      }
      analyticsCallback(next);
    }
  },
  setAllParams: (params) => set({ params, _clearImmediate: false }),
}));
