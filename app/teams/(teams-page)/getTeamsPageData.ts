import { ITeamsSearchParams } from '@/types/teams.types';
import { parseFocusAreasParams, processFilters } from '@/utils/team.utils';
import { getTeamListFilters } from '@/services/teams.service';
import { getFocusAreas } from '@/services/common.service';
import { DEFAULT_ASK_TAGS, INITIAL_ITEMS_PER_PAGE } from '@/utils/constants';
import { getTeamList } from '@/app/actions/teams.actions';
import qs from 'qs';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

type FetchMode = 'filtersOnly' | 'withTeams';

/**
 * Fetch teams page data
 * @param searchParams - URL search parameters
 * @param mode - 'filtersOnly' fetches only filter data, 'withTeams' fetches teams plus filters
 */
export const getTeamsPageData = async (
  searchParams: ITeamsSearchParams,
  mode: FetchMode = 'withTeams'
) => {
  let teams = [];
  let isError = false;
  let totalTeams = 0;
  let filterValues;

  try {
    const { authToken } = getCookiesFromHeaders();

    // Prepare API calls based on mode
    const apiCalls: Promise<any>[] = [];

    // Always fetch filter-related data
    apiCalls.push(
      getTeamListFilters({}, authToken),
      getFocusAreas('Team', parseFocusAreasParams(searchParams))
    );

    // Only fetch a team list if the mode is 'withTeams'
    if (mode === 'withTeams') {
      const query = qs.stringify({
        ...searchParams,
        investmentFocus: searchParams.investmentFocus?.split('|').filter(Boolean),
        tiers: searchParams.tiers?.split('|').filter(Boolean),
      });
      apiCalls.unshift(getTeamList(query, 1, INITIAL_ITEMS_PER_PAGE, authToken));
    }

    // Execute all API calls in parallel
    const responses = await Promise.all(apiCalls);

    // Extract responses based on mode
    let teamListResponse;
    let teamListFiltersResponse;
    let focusAreaResponse;

    if (mode === 'withTeams') {
      [teamListResponse, teamListFiltersResponse, focusAreaResponse] = responses;
    } else {
      [teamListFiltersResponse, focusAreaResponse] = responses;
    }

    // Process askTags with defaults
    if (teamListFiltersResponse?.data?.askTags) {
      teamListFiltersResponse.data.askTags = [
        ...(teamListFiltersResponse?.data?.askTags || []),
        ...DEFAULT_ASK_TAGS.filter(
          (defaultTag) => !(teamListFiltersResponse?.data?.askTags || []).includes(defaultTag),
        ),
      ];
    }

    // Check for errors
    const hasError =
      teamListFiltersResponse?.isError ||
      focusAreaResponse?.error ||
      (mode === 'withTeams' && teamListResponse?.isError);

    if (hasError) {
      isError = true;
      return { isError };
    }

    // Process filter values
    filterValues = processFilters(
      searchParams,
      teamListFiltersResponse?.data,
      teamListFiltersResponse?.data,
      focusAreaResponse?.data,
    );

    // Handle 'all' asks selection
    if (searchParams?.asks === 'all') {
      filterValues.asks.forEach((ask) => {
        if (!ask.disabled) {
          ask.selected = true;
        }
      });
    }

    // Extract teams data if mode is 'withTeams'
    if (mode === 'withTeams' && teamListResponse) {
      teams = teamListResponse.data;
      totalTeams = teamListResponse?.totalItems;
    }

    return { teams, totalTeams, isError, filterValues };
  } catch (error: unknown) {
    isError = true;
    console.error(`Error in getting teams ${mode === 'filtersOnly' ? 'filters' : 'content'}:`, error);
    return { isError };
  }
};

// Convenience wrapper for filters-only data
export const getTeamsFiltersData = async (searchParams: ITeamsSearchParams) => {
  return getTeamsPageData(searchParams, 'filtersOnly');
};
