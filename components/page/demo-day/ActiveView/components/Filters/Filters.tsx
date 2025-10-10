import React, { useMemo } from 'react';
import { useGetMembersFilterCount } from '@/components/page/members/hooks/useGetMembersFilterCount';
import s from '@/components/page/members/MembersFilter/MembersFilter.module.scss';
import FilterCount from '@/components/ui/filter-count';
import { FilterSection } from '@/components/page/members/MembersFilter/FilterSection';
import { FilterSearch } from '@/components/page/members/MembersFilter/FilterSearch';
import { FilterList, FilterOption } from './components/FilterList';
import { useGetTeamsList } from '@/services/demo-day/hooks/useGetTeamsList';
import { useFilterStore } from '@/services/members/store';

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

  // Build stage options dynamically from teams data
  const stageOptions = useMemo((): FilterOption[] => {
    if (!teams) return [];

    const stageMap = new Map<string, { name: string; count: number }>();

    teams.forEach((team) => {
      if (!team.team) return;

      const stage = team.team.fundingStage;
      const existing = stageMap.get(stage.uid);
      if (existing) {
        existing.count += 1;
      } else {
        stageMap.set(stage.uid, { name: stage.title, count: 1 });
      }
    });

    return Array.from(stageMap.entries())
      .map(([uid, { name, count }]) => ({
        id: uid,
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
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

      {/*<div className={s.footer}>*/}
      {/*  <button className={s.secondaryBtn} onClick={clearParams}>*/}
      {/*    Clear filters*/}
      {/*  </button>*/}

      {/*  <button className={s.primaryBtn} onClick={props.onClose}>*/}
      {/*    Apply filters*/}
      {/*  </button>*/}
      {/*</div>*/}
    </div>
  );
};
