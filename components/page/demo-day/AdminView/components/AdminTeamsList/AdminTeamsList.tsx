import React, { useRef, useState } from 'react';
import { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { useFilterStore } from '@/services/members/store';
import { TeamProfileCard } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamProfileCard';
import { TeamDetailsDrawer } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamDetailsDrawer';
import { TeamsListLoading } from '@/components/page/demo-day/shared/TeamsListStates';
import s from '@/components/page/demo-day/ActiveView/components/TeamsList/TeamsList.module.scss';
import { getParsedValue } from '@/utils/common.utils';
import { IUserInfo } from '@/types/shared.types';
import Cookies from 'js-cookie';
import { TeamsListHeader } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamsListHeader';
import { RandomizationAlert } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/RandomizationAlert';
import { useTeamsFiltering } from '@/components/page/demo-day/ActiveView/components/TeamsList/hooks/useTeamsFiltering';
import { useGroupNavigation } from '@/components/page/demo-day/ActiveView/components/TeamsList/hooks/useGroupNavigation';
import { useTeamsSorting } from '@/components/page/demo-day/ActiveView/components/TeamsList/hooks/useTeamsSorting';

interface AdminTeamsListProps {
  profiles?: TeamProfile[];
  isLoading: boolean;
  isDirectoryAdmin?: boolean;
}

export const AdminTeamsList: React.FC<AdminTeamsListProps> = ({ profiles, isLoading, isDirectoryAdmin = false }) => {
  const [sortBy, setSortBy] = useState<string>('stage-asc');
  const [selectedTeam, setSelectedTeam] = useState<TeamProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const scrollPositionRef = useRef<number>(0);
  const { params } = useFilterStore();
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);

  // Get current user info
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

  // Function to check if current user is a founder of a team
  const isUserFounder = (team: TeamProfile): boolean => {
    if (!userInfo?.uid) return false;
    return team.founders.some((founder) => founder.uid === userInfo.uid);
  };

  // Get filter parameters from URL
  const searchTerm = params.get('search') || '';

  // Use custom hooks for filtering and sorting
  const { filteredTeams } = useTeamsFiltering({
    teams: profiles,
    searchTerm,
    params,
    isUserFounder,
  });

  const { filteredAndSortedTeams, groupedTeams, allGroupsWithCounts } = useTeamsSorting({
    userTeams: filteredTeams.userTeams,
    otherTeams: filteredTeams.otherTeams,
    sortBy,
  });

  const { activeGroup, groupRefs, scrollToGroup } = useGroupNavigation(groupedTeams, allGroupsWithCounts);

  const totalTeamsCount = profiles?.length || 0;

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  // Get the latest team data from the refetched profiles list
  const latestTeamData = profiles?.find((p) => p.uid === selectedTeam?.uid);

  const handleTeamClick = (team: TeamProfile) => {
    scrollPositionRef.current = document.body.scrollTop;
    setSelectedTeam(team);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTeam(null);
  };

  if (isLoading) {
    return <TeamsListLoading title="All Teams" />;
  }

  return (
    <div className={s.container}>
      <RandomizationAlert />

      <TeamsListHeader
        allGroupsWithCounts={allGroupsWithCounts}
        activeGroup={activeGroup}
        sortBy={sortBy}
        onGroupClick={scrollToGroup}
        onSortChange={handleSortChange}
        onFiltersClick={() => setIsFiltersDrawerOpen(true)}
      />

      <div className={s.teamsList}>
        {groupedTeams.map((group, groupIndex) => (
          <div
            key={group.stageGroup}
            className={s.stageGroup}
            ref={(el) => {
              if (el) {
                groupRefs.current.set(group.stageGroup, el);
              }
            }}
          >
            <h3 className={s.stageGroupHeader}>{group.label}</h3>
            {group.teams.map((profile) => (
              <TeamProfileCard key={profile.uid} team={profile} onClick={handleTeamClick} isAdmin={isDirectoryAdmin} />
            ))}
          </div>
        ))}

        {filteredAndSortedTeams.length === 0 && totalTeamsCount > 0 && (
          <div className={s.emptyState}>
            <p>No teams match the current filters.</p>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {totalTeamsCount === 0 && (
          <div className={s.emptyState}>
            <p>No teams found.</p>
          </div>
        )}
      </div>

      {/* Team Details Drawer */}
      <TeamDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        team={latestTeamData || selectedTeam}
        scrollPosition={scrollPositionRef.current}
        isAdmin={isDirectoryAdmin}
      />
    </div>
  );
};
