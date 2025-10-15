import React, { useState, useMemo, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import { useGetTeamsList, TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { useFilterStore } from '@/services/members/store';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { TeamProfileCard } from './components/TeamProfileCard';
import { TeamDetailsDrawer } from './components/TeamDetailsDrawer';
import { FiltersDrawer } from './components/FiltersDrawer';
import { TeamsListLoading, TeamsListError } from '@/components/page/demo-day/shared/TeamsListStates';
import s from './TeamsList.module.scss';

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2 4H14M4 8H12M6 12H10"
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

export const TeamsList: React.FC = () => {
  const { data: teams, isLoading, error } = useGetTeamsList();
  const [sortBy, setSortBy] = useState<string>('stage-asc');
  const [selectedTeam, setSelectedTeam] = useState<TeamProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
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
    if (!teams) return [];

    // Apply filters
    let filtered = teams.filter((team) => {
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

      // Activity filter (liked, connected, invested)
      if (selectedActivities.length > 0) {
        const matchesActivity = selectedActivities.some((activity) => {
          if (activity === 'liked') return team.liked;
          if (activity === 'connected') return team.connected;
          if (activity === 'invested') return team.invested;
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
  }, [teams, sortBy, searchTerm, selectedIndustries, selectedStages, selectedActivities, userInfo]);

  const selectedSortOption = SORT_OPTIONS.find((option) => option.value === sortBy);
  const totalTeamsCount = teams?.length || 0;
  const filteredTeamsCount = filteredAndSortedTeams.length;

  // Group teams by stage for rendering with headers
  const groupedTeams = useMemo(() => {
    const groups: { stageGroup: string; label: string; teams: TeamProfile[] }[] = [];
    const stageOrder = sortBy === 'stage-desc' ? STAGE_GROUP_ORDER_DESC : STAGE_GROUP_ORDER_ASC;

    stageOrder.forEach((stageGroup) => {
      const teamsInGroup = filteredAndSortedTeams.filter(
        (team) => getStageGroup(team.team?.fundingStage?.title || '') === stageGroup,
      );

      if (teamsInGroup.length > 0) {
        let label = '';
        switch (stageGroup) {
          case 'pre-seed':
            label = 'Pre-seed';
            break;
          case 'seed':
            label = 'Seed';
            break;
          case 'series':
            label = 'Series A/B';
            break;
          case 'other':
            label = 'Other';
            break;
        }

        groups.push({ stageGroup, label, teams: teamsInGroup });
      }
    });

    return groups;
  }, [filteredAndSortedTeams, sortBy]);

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

  // Scroll to specific group
  const scrollToGroup = (stageGroup: string) => {
    const element = groupRefs.current.get(stageGroup);
    if (element) {
      const headerOffset = 120; // Offset for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + document.body.scrollTop - headerOffset;

      document.body.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Track which group is currently visible
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = document.body.scrollTop + 200; // Offset for header

      // If scrolled to top, activate first group
      if (window.scrollY < 100 && groupedTeams.length > 0) {
        setActiveGroup(groupedTeams[0].stageGroup);
        return;
      }

      for (const group of groupedTeams) {
        const element = groupRefs.current.get(group.stageGroup);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveGroup(group.stageGroup);
            break;
          }
        }
      }
    };

    document.body.addEventListener('scroll', handleScroll);
    handleScroll(); // Set initial active group

    return () => document.body.removeEventListener('scroll', handleScroll);
  }, [groupedTeams]);

  if (isLoading) {
    return <TeamsListLoading title="Teams List" />;
  }

  if (error) {
    return <TeamsListError title="Teams List" message="Failed to load teams. Please try again." />;
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          {groupedTeams.map((group) => (
            <button
              key={group.stageGroup}
              className={clsx(s.groupBadge, {
                [s.active]: activeGroup === group.stageGroup,
              })}
              onClick={() => scrollToGroup(group.stageGroup)}
            >
              <span className={s.groupLabel}>{group.label}</span>
              <span className={s.groupCount}>{group.teams.length}</span>
            </button>
          ))}
        </div>

        <div className={s.filtersWrapper}>
          <button className={s.filterButton} onClick={() => setIsFiltersDrawerOpen(true)}>
            <FilterIcon />
            <span>Filters</span>
          </button>
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
      </div>

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
