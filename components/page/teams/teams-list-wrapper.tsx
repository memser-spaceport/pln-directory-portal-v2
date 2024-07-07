'use client';

import { PAGE_ROUTES, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import {  getAnalyticsTeamInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import TeamsList from './team-list';
import { ITeam } from '@/types/teams.types';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import TeamGridView from './team-grid-view';
import TeamListView from './team-list-view';
import Link from 'next/link';

const TeamListWrapper = (props: any) => {
  const searchParams = props?.searchParams;
  const viewType = searchParams['viewType'] || VIEW_TYPE_OPTIONS.GRID;
  const allTeams = props?.teams ?? [];
  const userInfo = props?.userInfo;

  const analytics = useTeamAnalytics();
  const onTeamClickHandler = (team: ITeam) => {
    triggerLoader(true);
    analytics.onTeamCardClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
  };

  return (
    <div>
      <TeamsList {...props}>
        {allTeams?.map((team: ITeam, index: number) => (
          <div
            key={`${team} + ${index}`}
            className={`team-list__team ${VIEW_TYPE_OPTIONS.GRID === viewType ? 'team-list__grid__team' : 'team-list__list__team'}`}
            onClick={() => onTeamClickHandler(team)}
          >
            <Link href={`${PAGE_ROUTES.TEAMS}/${team?.id}`}>
              {VIEW_TYPE_OPTIONS.GRID === viewType && <TeamGridView team={team} viewType={viewType} />}
              {VIEW_TYPE_OPTIONS.LIST === viewType && <TeamListView team={team} viewType={viewType} />}
            </Link>
          </div>
        ))}
      </TeamsList>
    </div>
  );
};

export default TeamListWrapper;
