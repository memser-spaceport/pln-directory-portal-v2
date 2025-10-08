import React, { useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { useFilterStore } from '@/services/members/store';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { TeamProfileCard } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamProfileCard';
import { TeamDetailsDrawer } from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamDetailsDrawer';
import s from '@/components/page/demo-day/ActiveView/components/TeamsList/TeamsList.module.scss';

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
  { value: 'default', label: 'Default' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'stage-asc', label: 'Company Stage A-Z' },
  { value: 'stage-desc', label: 'Company Stage Z-A' },
  { value: 'recent', label: 'Most Recent' },
];

interface AdminTeamsListProps {
  profiles?: TeamProfile[];
  isLoading: boolean;
}

export const AdminTeamsList: React.FC<AdminTeamsListProps> = ({ profiles, isLoading }) => {
  const [sortBy, setSortBy] = useState<string>('default');
  const [selectedTeam, setSelectedTeam] = useState<TeamProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const scrollPositionRef = useRef<number>(0);
  const { params } = useFilterStore();

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

  // Filter and sort teams based on current filter parameters
  const filteredAndSortedTeams = useMemo(() => {
    if (!profiles) return [];

    // Apply filters
    let filtered = profiles.filter((profile) => {
      // Search filter - check team name and description
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = profile.team.name.toLowerCase().includes(searchLower);
        const matchesDescription = profile.team.shortDescription?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      // Industry filter
      if (selectedIndustries.length > 0) {
        const teamIndustryUids = profile.team.industryTags.map((tag) => tag.uid);
        const hasMatchingIndustry = selectedIndustries.some((industryUid) => teamIndustryUids.includes(industryUid));
        if (!hasMatchingIndustry) {
          return false;
        }
      }

      // Stage filter
      if (selectedStages.length > 0) {
        const teamStageUid = profile.team.fundingStage.uid;
        if (!selectedStages.includes(teamStageUid)) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    return [...filtered].sort((a, b) => {
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
          return b.uid.localeCompare(a.uid);
        default:
          return 0;
      }
    });
  }, [profiles, sortBy, searchTerm, selectedIndustries, selectedStages]);

  const selectedSortOption = SORT_OPTIONS.find((option) => option.value === sortBy);
  const totalTeamsCount = profiles?.length || 0;
  const filteredTeamsCount = filteredAndSortedTeams.length;

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleTeamClick = (team: TeamProfile) => {
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
          <h2 className={s.title}>All Teams (Admin)</h2>
          <div className={s.headerRight}>
            <span className={s.counter}>Loading...</span>
          </div>
        </div>
        <div className={s.loading}>Loading teams...</div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h2 className={s.title}>All Teams (Admin)</h2>
          <span className={s.counter}>
            ({filteredTeamsCount}
            {totalTeamsCount !== filteredTeamsCount ? ` of ${totalTeamsCount}` : ''})
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
        {filteredAndSortedTeams.map((profile) => (
          <TeamProfileCard key={profile.uid} team={profile} onClick={handleTeamClick} isAdmin={true} />
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
        isAdmin={true}
      />
    </div>
  );
};
