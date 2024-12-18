import { Metadata } from 'next';

import {getTeamListFilters } from '@/services/teams.service';
import { ITeamListOptions, ITeamsSearchParams } from '@/types/teams.types';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getTeamsListOptions, getTeamsOptionsFromQuery, processFilters } from '@/utils/team.utils';
import EmptyResult from '../../components/core/empty-result';
import Error from '../../components/core/error';
import FilterWrapper from '../../components/page/teams/filter-wrapper';
import TeamsToolbar from '../../components/page/teams/teams-toolbar';
import styles from './page.module.css';
import TeamList from '@/components/page/teams/team-list';
import { getFocusAreas } from '@/services/common.service';
import { getTeamList } from '../actions/teams.actions';

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
            {teams?.length >= 0 && <TeamList teams={teams} totalTeams={totalTeams} searchParams={searchParams} userInfo={userInfo} />}
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

  try {
    const optionsFromQuery = getTeamsOptionsFromQuery(searchParams);
    const listOptions: ITeamListOptions = getTeamsListOptions(optionsFromQuery);

    const [teamListResponse, teamListFiltersResponse, teamListFiltersForOptionsResponse, focusAreaResponse] = await Promise.all([
      getTeamList(listOptions),
      getTeamListFilters({}),
      getTeamListFilters(listOptions),
      getFocusAreas("Team",searchParams),
    ]);

    if (teamListResponse?.isError || teamListFiltersResponse?.isError || teamListFiltersForOptionsResponse?.isError || focusAreaResponse?.error) {
      isError = true;
      return { isError };
    } 

    teams = teamListResponse.data;
    totalTeams = teamListResponse?.totalItems;
    filtersValues = processFilters(searchParams, teamListFiltersResponse?.data, teamListFiltersForOptionsResponse?.data, focusAreaResponse?.data);
    return JSON.parse(JSON.stringify({ isError, filtersValues, totalTeams, teams }));
  } catch (error: unknown) {
    isError = true;
    console.error('Error in gettting teams page data', error);
    return { isError };
  }
};

export const metadata: Metadata = {
  title: 'Teams | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network people orient themselves within the network by making it easy to learn about other teams and people, including their roles, capabilities, and experiences.',
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
