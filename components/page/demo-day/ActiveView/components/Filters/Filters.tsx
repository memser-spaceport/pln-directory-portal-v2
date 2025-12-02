import React, { useMemo } from 'react';
import { useGetMembersFilterCount } from '@/components/page/members/hooks/useGetMembersFilterCount';
import { FilterSection } from '@/components/page/members/MembersFilter/FilterSection';
import { FilterSearch } from '@/components/page/members/MembersFilter/FilterSearch';
import { FilterList, FilterOption } from './components/FilterList';
import { useGetTeamsList } from '@/services/demo-day/hooks/useGetTeamsList';
import { useFilterStore } from '@/services/members/store';
import { SupportSection } from '@/components/page/demo-day/components/SupportSection';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';

import s from './Filters.module.scss';

export const Filters = () => {
  const appliedFiltersCount = useGetMembersFilterCount();
  const { clearParams } = useFilterStore();

  // Fetch teams data
  const { data: teams, isLoading: teamsLoading } = useGetTeamsList();

  // Build industry options dynamically from teams data
  const industryOptions = useMemo((): FilterOption[] => {
    if (!teams) return [];

    const industryMap = new Map<string, { name: string; count: number }>();

    teams.forEach((team) => {
      team.team.industryTags.forEach((tag) => {
        if (!tag) return;

        const existing = industryMap.get(tag.uid);
        if (existing) {
          existing.count += 1;
        } else {
          industryMap.set(tag.uid, { name: tag.title, count: 1 });
        }
      });
    });

    return Array.from(industryMap.entries())
      .map(([uid, { name, count }]) => ({
        id: uid,
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [teams]);

  // Build stage options dynamically from teams data with grouping
  const stageOptions = useMemo((): FilterOption[] => {
    if (!teams) return [];

    // Initialize all main stage groups with 0 count
    const stageMap = new Map<string, { name: string; count: number; uids: string[] }>([
      ['pre-seed', { name: 'Pre-seed', count: 0, uids: [] }],
      ['seed', { name: 'Seed', count: 0, uids: [] }],
      ['series', { name: 'Series A/B', count: 0, uids: [] }],
      ['fund', { name: 'Fund', count: 0, uids: [] }],
      ['other', { name: 'Other', count: 0, uids: [] }],
    ]);

    teams.forEach((team) => {
      if (!team.team || !team.team.fundingStage) return;

      const stage = team.team.fundingStage;
      const stageName = stage.title.toLowerCase();

      // Determine the group for this stage
      let groupKey: string;

      if (stageName.includes('pre-seed') || stageName.includes('preseed')) {
        groupKey = 'pre-seed';
      } else if (stageName.includes('seed') && !stageName.includes('pre')) {
        groupKey = 'seed';
      } else if (
        stageName.includes('series a') ||
        stageName.includes('series b') ||
        stageName.includes('series c') ||
        stageName.includes('series d') ||
        stageName.includes('series')
      ) {
        groupKey = 'series';
      } else if (stageName.includes('fund')) {
        groupKey = 'fund';
      } else {
        // All other stages go to "Other" group
        groupKey = 'other';
      }

      // Update the stage map with count and UIDs
      const existing = stageMap.get(groupKey);
      if (existing) {
        existing.count += 1;
        if (!existing.uids.includes(stage.uid)) {
          existing.uids.push(stage.uid);
        }
      }
    });

    // Convert to FilterOption format and filter out "Other" if count is 0
    return Array.from(stageMap.entries())
      .map(([key, { name, count, uids }]) => ({
        id: uids.length > 0 ? uids.join(',') : key, // Use key if no UIDs (count is 0)
        name,
        count,
      }))
      .filter((option) => {
        // Hide "Other" group if it has no teams
        if (option.name === 'Other') {
          return false;
        }
        return true;
      });
  }, [teams]);

  // Build activity options (liked, connected, invested, referred)
  const activityOptions = useMemo((): FilterOption[] => {
    if (!teams) return [];

    const likedCount = teams.filter((team) => team.liked).length;
    const connectedCount = teams.filter((team) => team.connected).length;
    const investedCount = teams.filter((team) => team.invested).length;
    const referredCount = teams.filter((team) => team.referral).length;

    const options: FilterOption[] = [];

    if (likedCount > 0) {
      options.push({ id: 'liked', name: 'Liked', count: likedCount });
    }

    if (connectedCount > 0) {
      options.push({ id: 'connected', name: 'Connected', count: connectedCount });
    }

    if (investedCount > 0) {
      options.push({ id: 'invested', name: 'Signaled investment interest', count: investedCount });
    }

    if (referredCount > 0) {
      options.push({ id: 'referral', name: 'Intros made', count: referredCount });
    }

    return options;
  }, [teams]);

  return (
    <FiltersSidePanel clearParams={clearParams} appliedFiltersCount={appliedFiltersCount} className={s.root} hideFooter>
      {activityOptions.length > 0 && (
        <FilterSection title="My Activity">
          <FilterList
            options={activityOptions}
            paramName="activity"
            showAllLabel=""
            placeholder=""
            emptyMessage=""
            hideSearch
          />
        </FilterSection>
      )}

      <FilterSection title="Team Search">
        <FilterSearch placeholder="Search for a team" />
      </FilterSection>

      <FilterSection title="Industry">
        <FilterList
          options={industryOptions}
          paramName="industry"
          showAllLabel="Show All Industries"
          placeholder="E.g. AI, DePIN, Web3, etc."
          emptyMessage={teamsLoading ? 'Loading industries...' : 'No industries found'}
          initialDisplayCount={6}
          useScrollOnly
        />
      </FilterSection>

      <FilterSection title="Stage/Type">
        <FilterList
          hideSearch
          options={stageOptions}
          paramName="stage"
          showAllLabel="Show All Stages"
          placeholder="E.g. Seed, Pre-Seed, etc."
          emptyMessage={teamsLoading ? 'Loading stages...' : 'No stages found'}
        />
      </FilterSection>

      {/* Support Section */}
      <SupportSection />

      {/*<div className={s.footer}>*/}
      {/*  <button className={s.secondaryBtn} onClick={clearParams}>*/}
      {/*    Clear filters*/}
      {/*  </button>*/}

      {/*  <button className={s.primaryBtn} onClick={props.onClose}>*/}
      {/*    Apply filters*/}
      {/*  </button>*/}
      {/*</div>*/}
    </FiltersSidePanel>
  );
};
