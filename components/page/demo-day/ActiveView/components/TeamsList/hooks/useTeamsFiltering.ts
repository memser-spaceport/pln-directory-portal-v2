import { useMemo } from 'react';
import { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';

interface UseTeamsFilteringParams {
  teams: TeamProfile[] | undefined;
  searchTerm: string;
  params: URLSearchParams;
  isUserFounder: (team: TeamProfile) => boolean;
}

export const useTeamsFiltering = ({ teams, searchTerm, params, isUserFounder }: UseTeamsFilteringParams) => {
  const selectedIndustries = useMemo(() => {
    const industryParam = params.get('industry');
    return industryParam ? industryParam.split(URL_QUERY_VALUE_SEPARATOR) : [];
  }, [params]);

  const selectedStages = useMemo(() => {
    const stageParam = params.get('stage');
    return stageParam ? stageParam.split(URL_QUERY_VALUE_SEPARATOR) : [];
  }, [params]);

  const selectedActivities = useMemo(() => {
    const activityParam = params.get('activity');
    return activityParam ? activityParam.split(URL_QUERY_VALUE_SEPARATOR) : [];
  }, [params]);

  const filteredTeams = useMemo(() => {
    if (!teams) return { userTeams: [], otherTeams: [] };

    // Apply filters
    const filtered = teams.filter((team) => {
      // Search filter - check team name and description
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = team.team.name.toLowerCase().includes(searchLower);
        const matchesDescription = team.team.shortDescription?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      // Industry filter
      if (selectedIndustries.length > 0) {
        const teamIndustryUids = team.team?.industryTags?.map((tag) => tag.uid);
        const hasMatchingIndustry = selectedIndustries.some((industryUid) => teamIndustryUids.includes(industryUid));
        if (!hasMatchingIndustry) {
          return false;
        }
      }

      // Stage filter
      if (selectedStages.length > 0) {
        const teamStageUid = team.team?.fundingStage?.uid;
        if (!selectedStages.includes(teamStageUid)) {
          return false;
        }
      }

      // Activity filter (liked, connected, invested, referred)
      if (selectedActivities.length > 0) {
        const matchesActivity = selectedActivities.some((activity) => {
          if (activity === 'liked') return team.liked;
          if (activity === 'connected') return team.connected;
          if (activity === 'invested') return team.invested;
          if (activity === 'referral') return team.referral;
          return false;
        });
        if (!matchesActivity) {
          return false;
        }
      }

      return true;
    });

    // Separate user's teams from other teams
    const userTeams = filtered.filter((team) => isUserFounder(team));
    const otherTeams = filtered.filter((team) => !isUserFounder(team));

    return { userTeams, otherTeams };
  }, [teams, searchTerm, selectedIndustries, selectedStages, selectedActivities, isUserFounder]);

  return {
    filteredTeams,
    selectedIndustries,
    selectedStages,
    selectedActivities,
  };
};

