import { getAllTeams, getTeamsFilters } from '@/services/teams.service';
import { IUserInfo } from '@/types/shared.types';
import { ITeamListOptions, ITeamsSearchParams } from '@/types/teams.types';
import { calculateTotalPages } from '@/utils/common.utils';
import { ITEMS_PER_PAGE, PAGE_ROUTES } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getTeamsListOptions, getTeamsOptionsFromQuery } from '@/utils/team.utils';
import { Metadata } from 'next';
import EmptyResult from '../../components/core/empty-result';
import Error from '../../components/core/error';
import { PaginationBox } from '../../components/core/pagination-box';
import FilterWrapper from '../../components/page/teams/filter-wrapper';
import TeamsList from '../../components/page/teams/team-list';
import TeamsToolbar from '../../components/page/teams/teams-toolbar';
import styles from './page.module.css';
import TeamListWrapper from '@/components/page/teams/teams-list-wrapper';

async function Page({ searchParams }: { searchParams: ITeamsSearchParams }) {
  const { userInfo } = getCookiesFromHeaders();

  const { teams, filtersValues, isError, totalTeams, currentPage } = await getPageData(searchParams);

  const totalPages = calculateTotalPages(totalTeams, ITEMS_PER_PAGE);

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
    const [teamsResponse, teamFiltersResponse] = await Promise.all([getAllTeams(authToken, listOptions, 0, 0), getTeamsFilters(optionsFromQuery, searchParams)]);

    if (teamsResponse?.error || teamFiltersResponse?.error) {
      isError = true;
      return { isError, filtersValues, totalTeams, currentPage };
    }

    teams = teamsResponse.data?.formattedData;
    filtersValues = teamFiltersResponse?.data?.formattedFilters;
    totalTeams = teamFiltersResponse?.data?.totalTeams;
    return { teams, filtersValues, totalTeams, currentPage };
  } catch (error: unknown) {
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
        url: `https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Directory',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`],
  },
};
