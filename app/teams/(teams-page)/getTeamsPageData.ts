import { ITeamListOptions, ITeamsSearchParams } from '@/types/teams.types';
import {
  getTeamsListOptions,
  getTeamsOptionsFromQuery,
  parseFocusAreasParams,
  processFilters,
} from '@/utils/team.utils';
import { getTeamListFilters } from '@/services/teams.service';
import { getFocusAreas } from '@/services/common.service';
import { DEFAULT_ASK_TAGS, INITIAL_ITEMS_PER_PAGE } from '@/utils/constants';
import { getTeamList } from '@/app/actions/teams.actions';
import qs from 'qs';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

export const getTeamsPageData = async (searchParams: ITeamsSearchParams) => {
  let teams = [];
  let isError = false;
  let totalTeams = 0;
  let filterValues;

  try {
    const { authToken } = getCookiesFromHeaders();
    const optionsFromQuery = getTeamsOptionsFromQuery(searchParams);
    const listOptions: ITeamListOptions = getTeamsListOptions(optionsFromQuery);

    const query = qs.stringify({
      ...searchParams,
      investmentFocus: searchParams.investmentFocus?.split('|').filter(Boolean),
      tiers: searchParams.tiers?.split('|').filter(Boolean),
    });

    const teamListResponse = await getTeamList(query, 1, INITIAL_ITEMS_PER_PAGE, authToken);

    const [teamListFiltersResponse, focusAreaResponse] = await Promise.all([
      getTeamListFilters({}, authToken),
      getFocusAreas('Team', parseFocusAreasParams(searchParams)),
    ]);

    if (teamListFiltersResponse?.data?.askTags) {
      teamListFiltersResponse.data.askTags = [
        ...(teamListFiltersResponse?.data?.askTags || []),
        ...DEFAULT_ASK_TAGS.filter(
          (defaultTag) => !(teamListFiltersResponse?.data?.askTags || []).includes(defaultTag),
        ),
      ];
    }

    if (teamListResponse?.isError || teamListFiltersResponse?.isError || focusAreaResponse?.error) {
      isError = true;
      return { isError };
    }

    filterValues = processFilters(
      searchParams,
      teamListFiltersResponse?.data,
      teamListFiltersResponse?.data,
      focusAreaResponse?.data,
    );

    if (searchParams?.asks === 'all') {
      filterValues.asks.forEach((ask) => {
        if (!ask.disabled) {
          ask.selected = true;
        }
      });
    }

    teams = teamListResponse.data;
    totalTeams = teamListResponse?.totalItems;

    return JSON.parse(JSON.stringify({ teams, totalTeams, isError, filterValues }));
  } catch (error: unknown) {
    isError = true;
    console.error('Error in getting teams page filters data', error);
    return { isError };
  }
};
