import { getTeamListFilters } from '@/services/teams.service';
import { ITeamListOptions, ITeamsSearchParams } from '@/types/teams.types';
import { DEFAULT_ASK_TAGS } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getTeamsListOptions, getTeamsOptionsFromQuery, parseFocusAreasParams, processFilters } from '@/utils/team.utils';
import Error from '../../../../components/core/error';
import FilterWrapper from '../../../../components/page/teams/filter-wrapper';
import { getFocusAreas } from '@/services/common.service';

async function Page({ searchParams }: { searchParams: ITeamsSearchParams }) {
  const { userInfo } = getCookiesFromHeaders();

  const { filtersValues, isError } = await getPageData(searchParams);

  if (isError) {
    return <Error />;
  }

  return (
    <FilterWrapper searchParams={searchParams} filterValues={filtersValues} userInfo={userInfo} />
  );
}

export default Page;

const getPageData = async (searchParams: ITeamsSearchParams) => {
  let isError = false;
  let filtersValues;

  try {
    const optionsFromQuery = getTeamsOptionsFromQuery(searchParams);
    const listOptions: ITeamListOptions = getTeamsListOptions(optionsFromQuery);

    const [teamListFiltersResponse, teamListFiltersForOptionsResponse, focusAreaResponse] = await Promise.all([
      getTeamListFilters({}),
      getTeamListFilters(listOptions),
      getFocusAreas("Team", parseFocusAreasParams(searchParams)),
    ]);

    if (teamListFiltersResponse?.data?.askTags) {
      teamListFiltersResponse.data.askTags = [
        ...(teamListFiltersResponse?.data?.askTags || []),
        ...DEFAULT_ASK_TAGS.filter(
          (defaultTag) =>
            !(teamListFiltersResponse?.data?.askTags || []).includes(defaultTag)
        ),
      ];
    }

    if (teamListFiltersResponse?.isError || teamListFiltersForOptionsResponse?.isError || focusAreaResponse?.error) {
      isError = true;
      return { isError };
    }

    filtersValues = processFilters(searchParams, teamListFiltersResponse?.data, teamListFiltersForOptionsResponse?.data, focusAreaResponse?.data);
    
    if (searchParams?.asks === 'all') {
      filtersValues.asks.forEach((ask) => {
        if (!ask.disabled) {
          ask.selected = true;
        }
      });
    }

    return JSON.parse(JSON.stringify({ isError, filtersValues }));
  } catch (error: unknown) {
    isError = true;
    console.error('Error in getting teams page filters data', error);
    return { isError };
  }
};
