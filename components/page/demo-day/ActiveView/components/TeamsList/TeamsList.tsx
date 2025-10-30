import React, { useState, useRef, useEffect } from 'react';
import { useGetTeamsList, TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { useFilterStore } from '@/services/members/store';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { TeamProfileCard } from './components/TeamProfileCard';
import { TeamDetailsDrawer } from './components/TeamDetailsDrawer';
import { FiltersDrawer } from './components/FiltersDrawer';
import { TeamsListLoading, TeamsListError } from '@/components/page/demo-day/shared/TeamsListStates';
import { TeamsListHeader } from './components/TeamsListHeader';
import { RandomizationAlert } from './components/RandomizationAlert';
import { useTeamsFiltering } from './hooks/useTeamsFiltering';
import { useTeamsSorting } from './hooks/useTeamsSorting';
import { useGroupNavigation } from './hooks/useGroupNavigation';
import s from './TeamsList.module.scss';

export const TeamsList: React.FC = () => {
  const { data: teams, isLoading, error } = useGetTeamsList();
  const [sortBy, setSortBy] = useState<string>('stage-asc');
  const [selectedTeam, setSelectedTeam] = useState<TeamProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const scrollPositionRef = useRef<number>(0);
  const { params } = useFilterStore();

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
    teams,
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

  const totalTeamsCount = teams?.length || 0;

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleTeamClick = (team: TeamProfile) => {
    // Store current scroll position before opening drawer
    scrollPositionRef.current = document.body.scrollTop;
    setSelectedTeam(team);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTeam(null);
  };

  // Update selectedTeam when teams data changes
  useEffect(() => {
    if (selectedTeam && teams) {
      // Find the updated team data by uid
      const updatedTeam = teams.find((team) => team.uid === selectedTeam.uid);
      if (updatedTeam) {
        // Update selectedTeam with the new data
        setSelectedTeam(updatedTeam);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams, selectedTeam?.uid]);

  if (isLoading) {
    return <TeamsListLoading title="Teams List" />;
  }

  if (error) {
    return <TeamsListError title="Teams List" message="Failed to load teams. Please try again." />;
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
            {group.teams.map((team) => (
              <TeamProfileCard key={team.uid} team={team} onClick={handleTeamClick} />
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
        team={selectedTeam}
        scrollPosition={scrollPositionRef.current}
      />

      {/* Filters Drawer */}
      <FiltersDrawer isOpen={isFiltersDrawerOpen} onClose={() => setIsFiltersDrawerOpen(false)} />
    </div>
  );
};
