import { ITeamListOptions, ITeamsSearchParams } from '@/types/teams.types';
import { INITIAL_ITEMS_PER_PAGE } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getTeamsListOptions, getTeamsOptionsFromQuery } from '@/utils/team.utils';
import EmptyResult from '../../../../components/core/empty-result';
import Error from '../../../../components/core/error';
import TeamsToolbar from '../../../../components/page/teams/teams-toolbar';
import styles from './page.module.css';
import TeamList from '@/components/page/teams/team-list';
import { getTeamList } from '@/app/actions/teams.actions';

async function Page({ searchParams }: { searchParams: ITeamsSearchParams }) {
  const { userInfo } = getCookiesFromHeaders();

  const { teams, isError, totalTeams } = await getPageData(searchParams);

  if (isError) {
    return <Error />;
  }

  return (
    <div className={styles.team__right__content}>
      <div className={styles.team__right__toolbar}>
        <TeamsToolbar totalTeams={totalTeams} searchParams={searchParams} userInfo={userInfo} />
      </div>
      <div className={styles.team__right__teamslist}>
        {teams?.length >= 0 && <TeamList teams={teams} totalTeams={totalTeams} searchParams={searchParams} userInfo={userInfo} />}
        {teams?.length === 0 && <EmptyResult />}
      </div>
    </div>
  );
}

export default Page;

const getPageData = async (searchParams: ITeamsSearchParams) => {
  let teams = [];
  let isError = false;
  let totalTeams = 0;

  try {
    const optionsFromQuery = getTeamsOptionsFromQuery(searchParams);
    const listOptions: ITeamListOptions = getTeamsListOptions(optionsFromQuery);

    const teamListResponse = await getTeamList(listOptions, 1, INITIAL_ITEMS_PER_PAGE);

    if (teamListResponse?.isError) {
      isError = true;
      return { isError };
    }

    teams = teamListResponse.data;
    totalTeams = teamListResponse?.totalItems;

    return JSON.parse(JSON.stringify({ isError, totalTeams, teams }));
  } catch (error: unknown) {
    isError = true;
    console.error('Error in getting teams page content data', error);
    return { isError };
  }
};

