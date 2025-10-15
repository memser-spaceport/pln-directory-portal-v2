import React, { useMemo } from 'react';
import { useGetMembersFilterCount } from '@/components/page/members/hooks/useGetMembersFilterCount';
import s from '@/components/page/members/MembersFilter/MembersFilter.module.scss';
import FilterCount from '@/components/ui/filter-count';
import { FilterSection } from '@/components/page/members/MembersFilter/FilterSection';
import { FilterSearch } from '@/components/page/members/MembersFilter/FilterSearch';
import {
  FilterList,
  FilterOption,
} from '@/components/page/demo-day/ActiveView/components/Filters/components/FilterList';
import { useGetAllFundraisingProfiles } from '@/services/demo-day/hooks/useGetAllFundraisingProfiles';
import { useFilterStore } from '@/services/members/store';

export const AdminFilters = () => {
  const appliedFiltersCount = useGetMembersFilterCount();
  const { clearParams } = useFilterStore();

  // Fetch ALL teams data (without filters) to build filter options
  const { data: teams, isLoading: teamsLoading } = useGetAllFundraisingProfiles();

  // Build industry options dynamically from teams data
  const industryOptions = useMemo((): FilterOption[] => {
    if (!teams) return [];

    const industryMap = new Map<string, { name: string; count: number }>();

    teams.forEach((team) => {
      team.team?.industryTags?.forEach((tag) => {
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
    ]);

    const otherStages = new Map<string, { name: string; count: number; uids: string[] }>();

    teams.forEach((team) => {
      if (!team.team || !team.team.fundingStage) return;

      const stage = team.team.fundingStage;
      const stageName = stage.title.toLowerCase();

      // Determine the group for this stage
      let groupKey: string;
      let groupName: string;
      let isOther = false;

      if (stageName.includes('pre-seed') || stageName.includes('preseed')) {
        groupKey = 'pre-seed';
        groupName = 'Pre-seed';
      } else if (stageName.includes('seed') && !stageName.includes('pre')) {
        groupKey = 'seed';
        groupName = 'Seed';
      } else if (
        stageName.includes('series a') ||
        stageName.includes('series b') ||
        stageName.includes('series c') ||
        stageName.includes('series d') ||
        stageName.includes('series')
      ) {
        groupKey = 'series';
        groupName = 'Series A/B';
      } else {
        // For any other stages, keep them as individual options
        groupKey = stage.uid;
        groupName = stage.title;
        isOther = true;
      }

      if (isOther) {
        const existing = otherStages.get(groupKey);
        if (existing) {
          existing.count += 1;
          if (!existing.uids.includes(stage.uid)) {
            existing.uids.push(stage.uid);
          }
        } else {
          otherStages.set(groupKey, { name: groupName, count: 1, uids: [stage.uid] });
        }
      } else {
        const existing = stageMap.get(groupKey);
        if (existing) {
          existing.count += 1;
          if (!existing.uids.includes(stage.uid)) {
            existing.uids.push(stage.uid);
          }
        }
      }
    });

    // Convert main stages to FilterOption format
    const mainStages = Array.from(stageMap.entries()).map(([key, { name, count, uids }]) => ({
      id: uids.length > 0 ? uids.join(',') : key, // Use key if no UIDs (count is 0)
      name,
      count,
    }));

    // Convert other stages to FilterOption format (only if they exist)
    const otherStageOptions = Array.from(otherStages.entries())
      .map(([key, { name, count, uids }]) => ({
        id: uids.join(','),
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // Combine main stages with other stages
    return [...mainStages, ...otherStageOptions];
  }, [teams]);

  // Build activity options (liked, connected, invested)
  const activityOptions = useMemo((): FilterOption[] => {
    if (!teams) return [];

    const likedCount = teams.filter((team) => team.liked).length;
    const connectedCount = teams.filter((team) => team.connected).length;
    const investedCount = teams.filter((team) => team.invested).length;

    const options: FilterOption[] = [];

    if (likedCount > 0) {
      options.push({ id: 'liked', name: 'Liked', count: likedCount });
    }

    if (connectedCount > 0) {
      options.push({ id: 'connected', name: 'Connected', count: connectedCount });
    }

    if (investedCount > 0) {
      options.push({ id: 'invested', name: 'Invested', count: investedCount });
    }

    return options;
  }, [teams]);

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.title}>
          Filters
          {appliedFiltersCount > 0 && <FilterCount count={appliedFiltersCount} />}
        </h2>
        <button className={s.cleaarAllButton} onClick={clearParams}>
          Clear all
        </button>
      </div>

      {/* Body */}
      <div className={s.body}>
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
          />
        </FilterSection>

        <FilterSection title="Stage">
          <FilterList
            options={stageOptions}
            paramName="stage"
            showAllLabel="Show All Stages"
            placeholder="E.g. Seed, Pre-Seed, etc."
            emptyMessage={teamsLoading ? 'Loading stages...' : 'No stages found'}
          />
        </FilterSection>
      </div>
    </div>
  );
};
