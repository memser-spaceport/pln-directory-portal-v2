import { getAllTeams, getFocusAreasForTeams, getTeamList, getTeamListFilters, getTeamListFiltersForOptions, getTeamsFilters } from '@/services/teams.service';
import { ITeamListOptions, ITeamsSearchParams } from '@/types/teams.types';
import { calculateTotalPages } from '@/utils/common.utils';
import { ITEMS_PER_PAGE, SOCIAL_IMAGE_URL, URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getTagsFromValues, getTeamsListOptions, getTeamsOptionsFromQuery, parseTeamsFilters } from '@/utils/team.utils';
import { Metadata } from 'next';
import EmptyResult from '../../components/core/empty-result';
import Error from '../../components/core/error';
import FilterWrapper from '../../components/page/teams/filter-wrapper';
import TeamsToolbar from '../../components/page/teams/teams-toolbar';
import styles from './page.module.css';
import TeamListWrapper from '@/components/page/teams/teams-list-wrapper';

async function Page({ searchParams }: { searchParams: ITeamsSearchParams }) {
  const { userInfo } = getCookiesFromHeaders();

  const { teams, filtersValues, isError, totalTeams } = await getPageData(searchParams);

  if (isError) {
    return <Error />;
  }

  return (
    <section className={styles.team}>
      {/* Side-nav */}
      <aside className={styles.team__left}>
        <FilterWrapper searchParams={searchParams} filterValues={filtersValues} userInfo={userInfo} />
      </aside>
      {/* Teams */}
      <div className={styles.team__right}>
        <div className={styles.team__right__content}>
          <div className={styles.team__right__toolbar}>
            <TeamsToolbar totalTeams={totalTeams} searchParams={searchParams} userInfo={userInfo} />
          </div>
          <div className={styles.team__right__teamslist}>
            {teams?.length >= 0 && <TeamListWrapper teams={teams} totalTeams={totalTeams} searchParams={searchParams} userInfo={userInfo} />}
            {teams?.length === 0 && <EmptyResult />}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Page;

const getPageData = async (searchParams: ITeamsSearchParams) => {
  let teams = [];
  let isError = false;
  let filtersValues;
  let totalTeams = 0;
  let currentPage = 1;
  try {
    const { authToken } = getCookiesFromHeaders();
    const optionsFromQuery = getTeamsOptionsFromQuery(searchParams);
    const listOptions: ITeamListOptions = getTeamsListOptions(optionsFromQuery);
    currentPage = searchParams?.page ? Number(searchParams?.page) : 1;


    const [teamListRsp, teamListFiltersRsp, teamListFitersForOpsRsp, focusAreaRsp] = await Promise.all([
      getTeamList(listOptions, 1, 50),
      getTeamListFilters(),
      getTeamListFiltersForOptions(searchParams),
      getFocusAreasForTeams(searchParams),
    ]);

    console.log('teamListRsp', teamListFiltersRsp);


    totalTeams = teamListFitersForOpsRsp?.data?.formattedData?.length;

    const formattedValuesByFilter = parseTeamsFilters(teamListFiltersRsp?.data?.formattedData);
    const formattedAvailableValuesByFilter = parseTeamsFilters(teamListFitersForOpsRsp?.data?.formattedData);

    const focusAreaQuery = searchParams?.focusAreas;
    const focusAreaFilters = focusAreaQuery?.split(URL_QUERY_VALUE_SEPARATOR);
    const selectedFocusAreas = focusAreaFilters?.length > 0 ? focusAreaRsp?.data?.filter((focusArea: any) => focusAreaFilters.includes(focusArea.title)) : [];

    const formattedFilters = {
      tags: getTagsFromValues(formattedValuesByFilter?.tags, formattedAvailableValuesByFilter?.tags, searchParams?.tags),
      membershipSources: getTagsFromValues(formattedValuesByFilter?.membershipSources, formattedAvailableValuesByFilter?.membershipSources, searchParams?.membershipSources),
      fundingStage: getTagsFromValues(formattedValuesByFilter?.fundingStage, formattedAvailableValuesByFilter?.fundingStage, searchParams?.fundingStage),
      technology: getTagsFromValues(formattedValuesByFilter?.technology, formattedAvailableValuesByFilter?.technology, searchParams?.technology),
      focusAreas: {
        rawData: focusAreaRsp?.data,
        selectedFocusAreas,
      },
    };

    console.log('formattedFilters', formattedFilters);
    

    // if (teamListRsp?.error || teamFiltersResponse?.error) {
    //   isError = true;
    //   return { isError, filtersValues, totalTeams, currentPage };
    // }

    teams = teamListRsp.data?.formattedData;
    filtersValues = formattedFilters;
    totalTeams = totalTeams;
    return JSON.parse(JSON.stringify({ isError, filtersValues, totalTeams, currentPage, teams }));
  } catch (error: unknown) {
    console.error('Error in getPageData', error);
    isError = true;
    return { isError, filtersValues, totalTeams, currentPage };
  }
};

export const metadata: Metadata = {
  title: 'Teams | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Directory',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [SOCIAL_IMAGE_URL],
  },
};
