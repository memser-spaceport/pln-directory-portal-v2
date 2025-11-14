import { create } from 'zustand';
import { createFilterStore } from '@/services/filters';

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

// Legacy analytics callback support for backward compatibility
let legacyAnalyticsCallback: ((params: URLSearchParams) => void) | undefined;

/**
 * Set analytics callback for filter changes
 * @deprecated Use the onFilterChange config in createFilterStore instead
 * This is kept for backward compatibility with SyncParamsToUrl component
 */
export const setFilterAnalyticsCallback = (callback: (params: URLSearchParams) => void) => {
  legacyAnalyticsCallback = callback;
};

/**
 * Members Filter Store
 *
 * Uses the generic filter store factory with members-specific configuration.
 * Maintains backward compatibility with existing code.
 */
export const useFilterStore = createFilterStore({
  namespace: 'members',
  trackedParams: [
    'topics',
    'roles',
    'hasOfficeHours',
    'sort',
    'search',
    'isInvestor',
    'investmentFocus',
    'minTypicalCheckSize',
    'maxTypicalCheckSize',
    'includeFriends',
    'searchRoles',
  ],
  onFilterChange: (key, value, allParams) => {
    // Call legacy callback if set (for backward compatibility)
    if (legacyAnalyticsCallback) {
      legacyAnalyticsCallback(allParams);
    }
  },
  analyticsDebounceMs: 300,
});
