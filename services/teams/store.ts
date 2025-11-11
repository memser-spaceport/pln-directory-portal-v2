import { createFilterStore } from '@/services/filters';

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
    'includeFriends',        // Include Friends of Protocol Labs
    'officeHoursOnly',       // Only show teams with office hours
    'isRecent',              // New teams filter
    'isHost',                // Host contribution filter
    'isSponsor',             // Sponsor contribution filter

    // Multi-select filters
    'tags',                  // Team tags
    'membershipSources',     // Membership sources
    'fundingStage',          // Funding stage
    'technology',            // Technology tags
    'asks',                  // Team asks/requests

    // Focus areas (hierarchical)
    'teamAncestorFocusAreas', // Focus area filter

    // Search
    'search',                // Search query

    // Sorting/Pagination
    'sort',                  // Sort order
    'page',                  // Page number
  ],
  onFilterChange: (key, value, allParams) => {
    // Analytics will be integrated when we refactor the teams filter
    // For now, this is a placeholder
    console.log('Team filter changed:', key, value);
  },
});
