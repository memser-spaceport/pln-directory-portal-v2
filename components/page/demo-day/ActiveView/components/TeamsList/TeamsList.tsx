import React, { useState, useMemo, useRef } from 'react';
import { clsx } from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import { useGetTeamsList, TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { useFilterStore } from '@/services/members/store';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { TeamProfileCard } from './components/TeamProfileCard';
import { TeamDetailsDrawer } from './components/TeamDetailsDrawer';
import s from './TeamsList.module.scss';

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
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'stage-asc', label: 'Funding Stage A-Z' },
  { value: 'stage-desc', label: 'Funding Stage Z-A' },
  { value: 'recent', label: 'Most Recent' },
];

export const TeamsList: React.FC = () => {
  const { data: teams, isLoading, error } = useGetTeamsList();
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [selectedTeam, setSelectedTeam] = useState<TeamProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const scrollPositionRef = useRef<number>(0);
  const { params } = useFilterStore();

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
        const teamIndustryUids = team.team.industryTags.map(tag => tag.uid);
        const hasMatchingIndustry = selectedIndustries.some(industryUid =>
          teamIndustryUids.includes(industryUid)
        );
        if (!hasMatchingIndustry) {
          return false;
        }
      }

      // Stage filter
      if (selectedStages.length > 0) {
        const teamStageUid = team.team.fundingStage.uid;
        if (!selectedStages.includes(teamStageUid)) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.team.name.localeCompare(b.team.name);
        case 'name-desc':
          return b.team.name.localeCompare(a.team.name);
        case 'stage-asc':
          return a.team.fundingStage.title.localeCompare(b.team.fundingStage.title);
        case 'stage-desc':
          return b.team.fundingStage.title.localeCompare(a.team.fundingStage.title);
        case 'recent':
          // Sort by most recent (assuming we can use uid or another field for recency)
          return b.uid.localeCompare(a.uid);
        default:
          return 0;
      }
    });

    return sorted;
  }, [teams, sortBy, searchTerm, selectedIndustries, selectedStages]);

  const selectedSortOption = SORT_OPTIONS.find((option) => option.value === sortBy);
  const totalTeamsCount = teams?.length || 0;
  const filteredTeamsCount = filteredAndSortedTeams.length;

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleTeamClick = (team: TeamProfile) => {
    // Store current scroll position before opening drawer
    scrollPositionRef.current = window.scrollY;
    setSelectedTeam(team);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTeam(null);
  };

  if (isLoading) {
    return (
      <div className={s.container}>
        <div className={s.header}>
          <h2 className={s.title}>Teams List</h2>
          <div className={s.headerRight}>
            <span className={s.counter}>Loading...</span>
          </div>
        </div>
        <div className={s.loading}>Loading teams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.container}>
        <div className={s.header}>
          <h2 className={s.title}>Teams List</h2>
        </div>
        <div className={s.error}>Failed to load teams. Please try again.</div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h2 className={s.title}>Teams List</h2>
          <span className={s.counter}>
            ({filteredTeamsCount}{totalTeamsCount !== filteredTeamsCount ? ` of ${totalTeamsCount}` : ''})
          </span>
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
        {filteredAndSortedTeams.map((team) => (
          <TeamProfileCard key={team.uid} team={team} onClick={handleTeamClick} />
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
    </div>
  );
};
