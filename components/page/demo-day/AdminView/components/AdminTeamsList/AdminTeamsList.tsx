import React, { useMemo, useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { useFilterStore } from '@/services/members/store';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { TeamProfileCard } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamProfileCard';
import { TeamDetailsDrawer } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamDetailsDrawer';
import { TeamsListLoading, TeamsListError } from '@/components/page/demo-day/shared/TeamsListStates';
import s from '@/components/page/demo-day/ActiveView/components/TeamsList/TeamsList.module.scss';
import { getParsedValue } from '@/utils/common.utils';
import { IUserInfo } from '@/types/shared.types';
import Cookies from 'js-cookie';

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 11C12.5523 11 13 11.4477 13 12V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V12C11 11.4477 11.4477 11 12 11ZM12 7C11.4477 7 11 7.44772 11 8C11 8.55228 11.4477 9 12 9C12.5523 9 13 8.55228 13 8C13 7.44772 12.5523 7 12 7Z"
      fill="#0A0C11"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SortIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 4H13M5 8H11M7 12H9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type SortOption = {
  value: string;
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  // { value: 'default', label: 'Default' },
  // { value: 'name-asc', label: 'Name A-Z' },
  // { value: 'name-desc', label: 'Name Z-A' },
  { value: 'stage-asc', label: 'Pre-seed > Seed > Series A/B' },
  { value: 'stage-desc', label: 'Series A/B > Seed > Pre-seed' },
  // { value: 'recent', label: 'Most Recent' },
];

// Helper function to determine stage group
const getStageGroup = (fundingStage: string): string => {
  const stageLower = fundingStage.toLowerCase();

  if (stageLower.includes('pre-seed') || stageLower.includes('preseed')) {
    return 'pre-seed';
  } else if (stageLower.includes('seed') && !stageLower.includes('pre')) {
    return 'seed';
  } else if (
    stageLower.includes('series a') ||
    stageLower.includes('series b') ||
    stageLower.includes('series c') ||
    stageLower.includes('series d') ||
    stageLower.includes('series')
  ) {
    return 'series';
  }

  // All other stages go to "Other" group
  return 'other';
};

// Stage group order for sorting
const STAGE_GROUP_ORDER_ASC = ['pre-seed', 'seed', 'series', 'other'];
const STAGE_GROUP_ORDER_DESC = ['series', 'seed', 'pre-seed', 'other'];

interface AdminTeamsListProps {
  profiles?: TeamProfile[];
  isLoading: boolean;
  isDirectoryAdmin?: boolean;
}

export const AdminTeamsList: React.FC<AdminTeamsListProps> = ({ profiles, isLoading, isDirectoryAdmin = false }) => {
  const [sortBy, setSortBy] = useState<string>('stage-asc');
  const [selectedTeam, setSelectedTeam] = useState<TeamProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('');
  const scrollPositionRef = useRef<number>(0);
  const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { params } = useFilterStore();

  // Get current user info
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

  // Function to check if current user is a founder of a team
  const isUserFounder = (team: TeamProfile): boolean => {
    if (!userInfo?.uid) return false;
    return team.founders.some((founder) => founder.uid === userInfo.uid);
  };

  // Get the latest team data from the refetched profiles list
  const latestTeamData = profiles?.find((p) => p.uid === selectedTeam?.uid);

  // Get filter parameters from URL
  const searchTerm = params.get('search') || '';
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

  // Filter and sort teams based on current filter parameters
  const filteredAndSortedTeams = useMemo(() => {
    if (!profiles) return [];

    // Apply filters
    let filtered = profiles.filter((profile) => {
      // Search filter - check team name and description
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = profile.team?.name.toLowerCase().includes(searchLower);
        const matchesDescription = profile.team.shortDescription?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      // Industry filter
      if (selectedIndustries.length > 0) {
        const teamIndustryUids = profile.team?.industryTags?.map((tag) => tag.uid);
        const hasMatchingIndustry = selectedIndustries.some((industryUid) => teamIndustryUids.includes(industryUid));
        if (!hasMatchingIndustry) {
          return false;
        }
      }

      // Stage filter
      if (selectedStages.length > 0) {
        const teamStageUid = profile.team?.fundingStage?.uid;
        if (!selectedStages.includes(teamStageUid)) {
          return false;
        }
      }

      // Activity filter (liked, connected, invested)
      if (selectedActivities.length > 0) {
        const matchesActivity = selectedActivities.some((activity) => {
          if (activity === 'liked') return profile.liked;
          if (activity === 'connected') return profile.connected;
          if (activity === 'invested') return profile.invested;
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
    const sortedUserTeams = sortGroupedTeams(userTeams);
    const sortedOtherTeams = sortGroupedTeams(otherTeams);

    // Combine: user teams first, then other teams
    return [...sortedUserTeams, ...sortedOtherTeams];
  }, [profiles, sortBy, searchTerm, selectedIndustries, selectedStages, selectedActivities, userInfo]);

  const selectedSortOption = SORT_OPTIONS.find((option) => option.value === sortBy);
  const totalTeamsCount = profiles?.length || 0;
  const filteredTeamsCount = filteredAndSortedTeams.length;

  // Helper function to get label for stage group
  const getStageGroupLabel = (stageGroup: string): string => {
    switch (stageGroup) {
      case 'pre-seed':
        return 'Pre-seed';
      case 'seed':
        return 'Seed';
      case 'series':
        return 'Series A/B';
      case 'other':
        return 'Other';
      default:
        return '';
    }
  };

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
    const groups: { stageGroup: string; label: string; teams: TeamProfile[] }[] = [];
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

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleTeamClick = (team: TeamProfile) => {
    scrollPositionRef.current = document.body.scrollTop;
    setSelectedTeam(team);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTeam(null);
  };

  // Scroll to specific group (group top at middle of viewport)
  const scrollToGroup = (stageGroup: string) => {
    const element = groupRefs.current.get(stageGroup);
    if (element) {
      const elementPosition = element.offsetTop;
      const viewportHeight = window.innerHeight;

      // Calculate position to place group top at middle of viewport
      const offsetPosition = elementPosition - 80;

      document.body.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Track which group enters the viewport from bottom
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.body.scrollTop;
      const viewportBottom = scrollTop + window.innerHeight;

      // Find the last group that has entered the viewport (from bottom)
      let lastVisibleGroup = null;

      for (const group of groupedTeams) {
        const element = groupRefs.current.get(group.stageGroup);
        if (element) {
          const { offsetTop } = element;
          const groupTop = offsetTop;

          // Check if group top has entered the viewport
          if (groupTop < viewportBottom) {
            lastVisibleGroup = group.stageGroup;
          }
        }
      }

      if (lastVisibleGroup) {
        setActiveGroup(lastVisibleGroup);
      } else if (allGroupsWithCounts.length > 0) {
        // Fallback to first group if none have entered
        setActiveGroup(allGroupsWithCounts[0].stageGroup);
      }
    };

    document.body.addEventListener('scroll', handleScroll);
    handleScroll(); // Set initial active group

    return () => document.body.removeEventListener('scroll', handleScroll);
  }, [groupedTeams, allGroupsWithCounts]);

  if (isLoading) {
    return <TeamsListLoading title="All Teams" />;
  }

  return (
    <div className={s.container}>
      <div className={s.alert}>
        <div className={s.alertContent}>
          <div className={s.alertIcon}>
            <InfoIcon />
          </div>
          <p className={s.alertText}>
            The list is split into stages. Within each stage, the sort order is randomized to give every team equal
            visibility. Your order is unique — no two users see the same list.
          </p>
        </div>
      </div>

      <div className={s.header}>
        <div className={s.headerLeft}>
          {allGroupsWithCounts.map((group) => (
            <button
              key={group.stageGroup}
              className={clsx(s.groupBadge, {
                [s.active]: activeGroup === group.stageGroup,
              })}
              onClick={() => scrollToGroup(group.stageGroup)}
            >
              <span className={s.groupLabel}>{group.label}</span>
              <span className={s.groupCount}>{group.count}</span>
            </button>
          ))}
        </div>

        <div className={s.headerRight}>
          <Menu.Root modal={false}>
            <Menu.Trigger className={s.sortButton}>
              <SortIcon />
              <span className={s.sortLabel}>Sort by: {selectedSortOption?.label}</span>
              <ChevronDownIcon />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className={s.menuPositioner} align="end" sideOffset={8}>
                <Menu.Popup className={s.menuPopup}>
                  {SORT_OPTIONS.map((option) => (
                    <Menu.Item
                      key={option.value}
                      className={clsx(s.menuItem, {
                        [s.active]: sortBy === option.value,
                      })}
                      onClick={() => handleSortChange(option.value)}
                    >
                      {option.label}
                    </Menu.Item>
                  ))}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>

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
