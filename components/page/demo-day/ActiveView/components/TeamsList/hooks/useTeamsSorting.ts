import { useMemo } from 'react';
import { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import {
  getStageGroup,
  getStageGroupLabel,
  STAGE_GROUP_ORDER_ASC,
  STAGE_GROUP_ORDER_DESC,
} from '../utils/stageGrouping';

interface UseTeamsSortingParams {
  userTeams: TeamProfile[];
  otherTeams: TeamProfile[];
  sortBy: string;
}

export interface GroupedTeams {
  stageGroup: string;
  label: string;
  teams: TeamProfile[];
}

export interface GroupWithCount {
  stageGroup: string;
  label: string;
  count: number;
}

export const useTeamsSorting = ({ userTeams, otherTeams, sortBy }: UseTeamsSortingParams) => {
  // Group teams by stage group
  const groupTeamsByStage = (teamsList: TeamProfile[]) => {
    const groups = new Map<string, TeamProfile[]>();

    teamsList.forEach((team) => {
      const stageGroup = getStageGroup(team.team?.fundingStage?.title || '');
      if (!groups.has(stageGroup)) {
        groups.set(stageGroup, []);
      }
      groups.get(stageGroup)!.push(team);
    });

    return groups;
  };

  // Sort groups and flatten
  const sortGroupedTeams = (teamsList: TeamProfile[]) => {
    const groups = groupTeamsByStage(teamsList);
    const stageOrder = sortBy === 'stage-desc' ? STAGE_GROUP_ORDER_DESC : STAGE_GROUP_ORDER_ASC;

    const result: TeamProfile[] = [];

    stageOrder.forEach((stageGroup) => {
      const teamsInGroup = groups.get(stageGroup);
      if (teamsInGroup && teamsInGroup.length > 0) {
        // Teams within each group maintain their original order (randomized on backend)
        result.push(...teamsInGroup);
      }
    });

    return result;
  };

  // Sort user teams and other teams separately by stage groups
  const filteredAndSortedTeams = useMemo(() => {
    const sortedUserTeams = sortGroupedTeams(userTeams);
    const sortedOtherTeams = sortGroupedTeams(otherTeams);

    // Combine: user teams first, then other teams
    return [...sortedUserTeams, ...sortedOtherTeams];
  }, [userTeams, otherTeams, sortBy]);

  // All groups with counts (for header badges) - always show all groups except 'other' if empty
  const allGroupsWithCounts = useMemo(() => {
    const stageOrder = sortBy === 'stage-desc' ? STAGE_GROUP_ORDER_DESC : STAGE_GROUP_ORDER_ASC;

    return stageOrder
      .map((stageGroup) => {
        const teamsInGroup = filteredAndSortedTeams.filter(
          (team) => getStageGroup(team.team?.fundingStage?.title || '') === stageGroup,
        );

        return {
          stageGroup,
          label: getStageGroupLabel(stageGroup),
          count: teamsInGroup.length,
        };
      })
      .filter((group) => {
        // Hide 'other' group if it has no teams
        if (group.stageGroup === 'other' && group.count === 0) {
          return false;
        }
        return true;
      });
  }, [filteredAndSortedTeams, sortBy]);

  // Group teams by stage for rendering with headers (only groups with teams)
  const groupedTeams = useMemo(() => {
    const groups: GroupedTeams[] = [];
    const stageOrder = sortBy === 'stage-desc' ? STAGE_GROUP_ORDER_DESC : STAGE_GROUP_ORDER_ASC;

    stageOrder.forEach((stageGroup) => {
      const teamsInGroup = filteredAndSortedTeams.filter(
        (team) => getStageGroup(team.team?.fundingStage?.title || '') === stageGroup,
      );

      if (teamsInGroup.length > 0) {
        groups.push({
          stageGroup,
          label: getStageGroupLabel(stageGroup),
          teams: teamsInGroup,
        });
      }
    });

    return groups;
  }, [filteredAndSortedTeams, sortBy]);

  return {
    filteredAndSortedTeams,
    groupedTeams,
    allGroupsWithCounts,
  };
};
