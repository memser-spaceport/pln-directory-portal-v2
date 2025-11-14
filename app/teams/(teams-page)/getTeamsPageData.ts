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

export const getTeamsPageData = async (searchParams: ITeamsSearchParams) => {
  let teams = [];
  let isError = false;
  let totalTeams = 0;
  let filterValues;

  try {
    const optionsFromQuery = getTeamsOptionsFromQuery(searchParams);
    const listOptions: ITeamListOptions = getTeamsListOptions(optionsFromQuery);

    const teamListResponse = await getTeamList(listOptions, 1, INITIAL_ITEMS_PER_PAGE);

    const [teamListFiltersResponse, teamListFiltersForOptionsResponse, focusAreaResponse] = await Promise.all([
      getTeamListFilters({}),
      getTeamListFilters(listOptions),
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

    if (
      teamListResponse?.isError ||
      teamListFiltersResponse?.isError ||
      teamListFiltersForOptionsResponse?.isError ||
      focusAreaResponse?.error
    ) {
      isError = true;
      return { isError };
    }

    filterValues = processFilters(
      searchParams,
      teamListFiltersResponse?.data,
      teamListFiltersForOptionsResponse?.data,
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
