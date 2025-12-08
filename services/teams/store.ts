import { createFilterStore } from '@/services/filters';

// Legacy analytics callback support for backward compatibility
let legacyAnalyticsCallback: ((params: URLSearchParams) => void) | undefined;

/**
 * Set analytics callback for filter changes
 * @deprecated Use the onFilterChange config in createFilterStore instead
 * This is kept for backward compatibility with SyncTeamsParamsToUrl component
 */
export const setFilterAnalyticsCallback = (callback: (params: URLSearchParams) => void) => {
  legacyAnalyticsCallback = callback;
};

/**
 * Teams Filter Store
 *
 * Manages filter state for the teams page using the generic filter infrastructure.
 * Handles URL synchronization and analytics integration.
 */
export const useTeamFilterStore = createFilterStore({
  namespace: 'teams',
  trackedParams: [
    // Toggles
    'includeFriends', // Include Friends of Protocol Labs
    'officeHoursOnly', // Only show teams with office hours
    'isRecent', // New teams filter
    'isHost', // Host contribution filter
    'isSponsor', // Sponsor contribution filter
    'isFund', // Fund filter

    // Multi-select filters
    'tags', // Team tags
    'membershipSources', // Membership sources
    'fundingStage', // Funding stage
    'technology', // Technology tags
    'asks', // Team asks/requests
    'investmentFocus', // Investment focus areas

    // Focus areas (hierarchical)
    'teamAncestorFocusAreas', // Focus area filter

    // Range filters
    'minTypicalCheckSize', // Minimum typical check size
    'maxTypicalCheckSize', // Maximum typical check size

    // Search
    'searchBy', // Team name search

    // Sorting/Pagination
    'sort', // Sort order
    'page', // Page number
  ],
  onFilterChange: (key, value, allParams) => {
    // Call legacy callback if set (for backward compatibility)
    if (legacyAnalyticsCallback) {
      legacyAnalyticsCallback(allParams);
    }
  },
});
