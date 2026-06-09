'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQueryStates } from 'nuqs';
import clsx from 'clsx';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';
import { useGetCoInvestorTeams } from '@/services/investors/hooks/useGetCoInvestorTeams';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import {
  CHECK_SIZE_RANGES,
  INDUSTRY_SECTOR_LABEL,
  SECTOR_TAGS,
  SECTOR_TAG_LABEL,
  STAGE_FOCUSES,
  STAGE_FOCUS_LABEL,
} from '@/services/investors/constants';
import type { CheckSizeRange, SectorTag, StageFocus } from '@/services/investors/types';
import { effectiveTeamRaisingStage } from '@/services/investors/raising-stage';
import { SearchIcon } from '@/components/icons';
import s from './WarmIntrosFilterRail.module.scss';

export function WarmIntrosFilterRail() {
  const [filters, setFilters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });
  const access = useInvestorsAccess();
  const { data: teams } = useGetCoInvestorTeams(access.canView);
  const [teamQuery, setTeamQuery] = useState('');

  const teamId = filters.wi_team_id;
  const team = teamId && teams ? teams.find((t) => t.team_id === teamId) : undefined;
  const teamRaisingStage = effectiveTeamRaisingStage(team);

  const effectiveStage = (filters.wi_stage || teamRaisingStage || team?.pl_invested_stage || '') as StageFocus | '';
  const effectiveCheckSize = (filters.wi_check_size || '') as CheckSizeRange | '';

  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    const q = teamQuery.toLowerCase().trim();
    if (!q) return teams;
    return teams.filter((t) => t.team_name.toLowerCase().includes(q));
  }, [teams, teamQuery]);

  const appliedFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.wi_team_id) n++;
    if (filters.wi_stage) n++;
    if (filters.wi_check_size) n++;
    n += filters.wi_sectors.length;
    return n;
  }, [filters]);

  const onClear = useCallback(() => {
    setFilters({ wi_team_id: null, wi_stage: null, wi_sectors: null, wi_check_size: null });
  }, [setFilters]);

  const toggleSector = (sec: SectorTag) => {
    const cur = filters.wi_sectors;
    const next = cur.includes(sec) ? cur.filter((x) => x !== sec) : [...cur, sec];
    setFilters({ wi_sectors: next.length ? next : null });
  };

  return (
    <FiltersSidePanel clearParams={onClear} appliedFiltersCount={appliedFiltersCount} className={s.root} hideFooter>
      <FilterSection title="Portfolio team">
        <div className={s.searchable}>
          <div className={s.inputWrap}>
            <span className={s.inputIcon}>
              <SearchIcon />
            </span>
            <input
              type="search"
              className={s.input}
              placeholder="Search teams…"
              value={teamQuery}
              onChange={(e) => setTeamQuery(e.target.value)}
            />
          </div>
          <div className={s.options}>
            {teamId && (
              <label className={clsx(s.option, s.optionOn)}>
                <input type="radio" checked onChange={() => setFilters({ wi_team_id: null })} />
                <span className={s.optionLabel}>{teams?.find((t) => t.team_id === teamId)?.team_name ?? teamId}</span>
                <button className={s.clearOne} onClick={() => setFilters({ wi_team_id: null })} title="Clear">
                  ×
                </button>
              </label>
            )}
            {filteredTeams
              .filter((t) => t.team_id !== teamId)
              .slice(0, 20)
              .map((t) => (
                <label key={t.team_id} className={s.option}>
                  <input
                    type="radio"
                    name="wi-team"
                    checked={false}
                    onChange={() => setFilters({ wi_team_id: t.team_id })}
                  />
                  <span className={s.optionLabel}>{t.team_name}</span>
                </label>
              ))}
            {!teams && <div className={s.emptyHint}>Loading teams…</div>}
            {teams && filteredTeams.length === 0 && <div className={s.emptyHint}>No matches.</div>}
          </div>
        </div>
        {team && (
          <div className={s.autoNote}>
            Auto-filled: {STAGE_FOCUS_LABEL[(teamRaisingStage ?? team.pl_invested_stage) as StageFocus]} ·{' '}
            {team.sectors.join(', ')}
          </div>
        )}
      </FilterSection>

      <FilterSection title="Stage focus">
        <div className={s.options}>
          <label className={clsx(s.option, !filters.wi_stage && s.optionOn)}>
            <input
              type="radio"
              name="wi-stage"
              checked={!filters.wi_stage}
              onChange={() => setFilters({ wi_stage: null })}
            />
            <span className={s.optionLabel}>Any</span>
          </label>
          {STAGE_FOCUSES.filter((st) => st !== 'unknown').map((st) => (
            <label key={st} className={clsx(s.option, effectiveStage === st && filters.wi_stage === st && s.optionOn)}>
              <input
                type="radio"
                name="wi-stage"
                checked={filters.wi_stage === st}
                onChange={() => setFilters({ wi_stage: st })}
              />
              <span className={s.optionLabel}>{STAGE_FOCUS_LABEL[st]}</span>
            </label>
          ))}
        </div>
        {team && !filters.wi_stage && effectiveStage && (
          <div className={s.autoNote}>Auto from team: {STAGE_FOCUS_LABEL[effectiveStage as StageFocus]}</div>
        )}
      </FilterSection>

      <FilterSection title="Check size">
        <div className={s.options}>
          <label className={clsx(s.option, !filters.wi_check_size && s.optionOn)}>
            <input
              type="radio"
              name="wi-check-size"
              checked={!filters.wi_check_size}
              onChange={() => setFilters({ wi_check_size: null })}
            />
            <span className={s.optionLabel}>Any</span>
          </label>
          {CHECK_SIZE_RANGES.filter((c) => c !== 'unknown').map((c) => (
            <label key={c} className={clsx(s.option, filters.wi_check_size === c && s.optionOn)}>
              <input
                type="radio"
                name="wi-check-size"
                checked={filters.wi_check_size === c}
                onChange={() => setFilters({ wi_check_size: c })}
              />
              <span className={s.optionLabel}>{c}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={INDUSTRY_SECTOR_LABEL}>
        <div className={s.sectorChips}>
          {SECTOR_TAGS.map((sec) => (
            <button
              key={sec}
              className={clsx(s.chip, filters.wi_sectors.includes(sec) && s.chipOn)}
              onClick={() => toggleSector(sec as SectorTag)}
            >
              {SECTOR_TAG_LABEL[sec]}
            </button>
          ))}
        </div>
      </FilterSection>
    </FiltersSidePanel>
  );
}
