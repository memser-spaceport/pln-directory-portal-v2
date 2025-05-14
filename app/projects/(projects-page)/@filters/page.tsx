import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getProjectSelectOptions, getProjectsFiltersFromQuery } from '@/utils/projects.utils';
import Error from '@/components/core/error';
import FilterWrapper from '@/components/page/projects/filter-wrapper';
import { getFocusAreas } from '@/services/common.service';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { getTeam, searchTeamsByName } from '@/services/teams.service';
import { getProjectFilters } from '@/services/projects.service';

export default async function Page({ searchParams }: any) {
  const { initialTeams, selectedTeam, isError, userInfo, focusAreas, filters } = await getPageData(searchParams);

  if (isError) {
    return <Error />;
  }

  return (
    <FilterWrapper initialTeams={initialTeams} selectedTeam={selectedTeam} searchParams={searchParams} userInfo={userInfo} focusAreas={focusAreas} filters={filters}/>
  );
}

const getPageData = async (searchParams: any) => {
  let isError = false;
  let selectedTeam = { label: '', value: '', logo: '' }
  let initialTeams = [];
  
  try {
    const { userInfo, isLoggedIn } = getCookiesFromHeaders();
    const filterFromQuery = getProjectsFiltersFromQuery(searchParams);
    const selectOpitons = getProjectSelectOptions(filterFromQuery);
    const focusAreasResponse = await getFocusAreas('Project', searchParams);

    if (focusAreasResponse?.error) {
      isError = true;
      return { isError };
    }

    if(searchParams["team"]) {
        const teamResponse = await getTeam(searchParams["team"], {
          with: 'logo,technologies,membershipSources,industryTags,fundingStage,teamMemberRoles.member',
        });
        if (!teamResponse.error) {
          const formattedTeam = teamResponse?.data?.formatedData;
          selectedTeam = ({ label: formattedTeam?.name, value: formattedTeam?.id, logo: formattedTeam?.logo }); 
        }
    }

    const [searchTeamsResponse, filterResponse] = await Promise.all([searchTeamsByName(selectedTeam.label), getProjectFilters(selectOpitons)]);

    if(!searchTeamsResponse.error) {
      initialTeams = searchTeamsResponse;
    }

    let filters = [];
    if(!filterResponse.error) {
      filters = filterResponse.data;
    }

    const focusAreaQuery = searchParams?.focusAreas;
    const focusAreaFilters = focusAreaQuery?.split(URL_QUERY_VALUE_SEPARATOR);
    const selectedFocusAreas = focusAreaFilters?.length > 0 ? focusAreasResponse?.data?.filter((focusArea: any) => focusAreaFilters?.includes(focusArea?.title)) : [];

    return {
      userInfo,
      focusAreas: {
        rawData: focusAreasResponse?.data || [],
        selectedFocusAreas,
      },
      isLoggedIn,
      selectedTeam,
      initialTeams,
      filters,
    };
  } catch (error) {
    isError = true;
    console.error(error);
    return { isError };
  }
};
