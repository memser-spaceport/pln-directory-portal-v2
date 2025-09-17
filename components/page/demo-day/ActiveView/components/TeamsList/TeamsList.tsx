import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import { useGetTeamsList } from '@/services/demo-day/hooks/useGetTeamsList';
import s from './TeamsList.module.scss';
import { ProfileHeader } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileHeader';
import { ProfileContent } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileContent';

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

  const sortedTeams = React.useMemo(() => {
    if (!teams) return [];

    const sorted = [...teams].sort((a, b) => {
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
  }, [teams, sortBy]);

  const selectedSortOption = SORT_OPTIONS.find((option) => option.value === sortBy);
  const teamsCount = teams?.length || 0;

  const handleSortChange = (value: string) => {
    setSortBy(value);
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
          <span className={s.counter}>({teamsCount})</span>
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
        {sortedTeams.map((item) => (
          <>
            <div className={s.profileCard}>
              <ProfileHeader
                image={item.team.logo.url || '/images/demo-day/profile-placeholder.svg'}
                name={item.team?.name || 'Team Name'}
                description={item?.team?.shortDescription || '-'}
                fundingStage={item?.team.fundingStage.title || '-'}
                tags={item?.team.industryTags.map((tag) => tag.title) || []}
              />
              <ProfileContent pitchDeckUrl={item?.onePagerUpload?.url} videoUrl={item?.videoUpload?.url} />
              <div className={s.profileDivider} />
            </div>
          </>
        ))}

        {sortedTeams.length === 0 && (
          <div className={s.emptyState}>
            <p>No teams found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
