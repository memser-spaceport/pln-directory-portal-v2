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
    'search', // Search query

    // Sorting/Pagination
    'sort', // Sort order
    'page', // Page number
  ],
  onFilterChange: (key, value, allParams) => {},
});
