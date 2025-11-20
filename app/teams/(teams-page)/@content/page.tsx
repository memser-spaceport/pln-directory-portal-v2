import { ITeamsSearchParams } from '@/types/teams.types';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import EmptyResult from '../../../../components/core/empty-result';
import Error from '../../../../components/core/error';
import TeamsToolbar from '../../../../components/page/teams/teams-toolbar';
import styles from './page.module.css';
import TeamList from '@/components/page/teams/team-list';
import { getTeamsPageData } from '@/app/teams/(teams-page)/getTeamsPageData';

async function Page({ searchParams }: { searchParams: ITeamsSearchParams }) {
  const { userInfo } = getCookiesFromHeaders();

  const { teams, isError, totalTeams = 0, filterValues } = await getPageData(searchParams);

  if (isError) {
    return <Error />;
  }

  return (
    <div className={styles.team__right__content}>
      <div className={styles.team__right__toolbar}>
        <TeamsToolbar totalTeams={totalTeams} searchParams={searchParams} userInfo={userInfo} />
      </div>
      <div className={styles.team__right__teamslist}>
        {teams?.length >= 0 && (
          <TeamList
            teams={teams}
            totalTeams={totalTeams}
            searchParams={searchParams}
            userInfo={userInfo}
            filterValues={filterValues}
          />
        )}
        {teams?.length === 0 && <EmptyResult />}
      </div>
    </div>
  );
}

export default Page;

const getPageData = async (searchParams: ITeamsSearchParams) => {
  return getTeamsPageData(searchParams);
};
