'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQueryStates } from 'nuqs';
import clsx from 'clsx';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';
import { useSavedViewsStore } from '@/services/investors/store';
import { SaveViewPopover } from '../SaveViewPopover/SaveViewPopover';
import { useGetCoInvestorTeams } from '@/services/investors/hooks/useGetCoInvestorTeams';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import {
  EMAIL_STATUSES,
  EMAIL_STATUS_LABEL,
  ENGAGEMENT_TIERS,
  ENGAGEMENT_TIER_LABEL,
  ENRICHMENT_STATUSES,
  INDUSTRY_SECTOR_LABEL,
  INVESTOR_TYPES,
  INVESTOR_TYPE_LABEL,
  SECTOR_TAGS,
  SECTOR_TAG_LABEL,
  SOURCES,
  STAGE_FOCUSES,
  STAGE_FOCUS_LABEL,
} from '@/services/investors/constants';
import s from './InvestorsFilterRail.module.scss';
import { SearchIcon } from '@/components/icons';

interface Props {
  /** Which tab the rail is rendering for. Hides irrelevant sections per tab. */
  tab: 'all' | 'co-investors';
}

/** Inline checkbox-list for a multi-select filter section. */
function CheckboxOptions<T extends string>({
  options,
  values,
  onChange,
  label,
}: {
  options: readonly T[];
  values: string[];
  onChange: (next: string[]) => void;
  label?: (v: T) => string;
}) {
  const set = new Set(values);
  const toggle = (v: T) => {
    const next = set.has(v) ? values.filter((x) => x !== v) : [...values, v];
    onChange(next);
  };
  return (
    <div className={s.options}>
      {options.map((v) => (
        <label key={v} className={clsx(s.option, set.has(v) && s.optionOn)}>
          <input type="checkbox" checked={set.has(v)} onChange={() => toggle(v)} />
          <span className={s.optionLabel}>{label ? label(v) : v}</span>
        </label>
      ))}
    </div>
  );
}

function SearchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const hasValue = !!props.value;
  const clearInput = () => {
    props.onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
  };
  return (
    <div className={s.inputWrap}>
      {hasValue ? (
        <button type="button" className={s.inputIconBtn} onClick={clearInput} aria-label="Clear">
          ×
        </button>
      ) : (
        <span className={s.inputIcon}>
          <SearchIcon />
        </span>
      )}
      <input {...props} className={s.input} />
    </div>
  );
}

/** Same as CheckboxOptions but with a search input on top — for longer lists. */
function SearchableCheckboxOptions<T extends string>({
  options,
  values,
  onChange,
  label,
  placeholder,
}: {
  options: readonly T[];
  values: string[];
  onChange: (next: string[]) => void;
  label?: (v: T) => string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const set = new Set(values);
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options;
    return options.filter((o) => (label ? label(o) : o).toString().toLowerCase().includes(q));
  }, [options, query, label]);
  const toggle = (v: T) => {
    const next = set.has(v) ? values.filter((x) => x !== v) : [...values, v];
    onChange(next);
  };
  return (
    <div className={s.searchable}>
      <SearchInput
        type="search"
        placeholder={placeholder ?? 'Search…'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={s.options} role="listbox">
        {filtered.length === 0 ? (
          <div className={s.emptyHint}>No matches.</div>
        ) : (
          filtered.map((v) => (
            <label key={v} className={clsx(s.option, set.has(v) && s.optionOn)}>
              <input type="checkbox" checked={set.has(v)} onChange={() => toggle(v)} />
              <span className={s.optionLabel}>{label ? label(v) : v}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

/** Searchable single-select for the "Co-invested with team" filter. */
function PortfolioTeamSelect({
  value,
  onChange,
  enabled,
}: {
  value: string;
  onChange: (next: string) => void;
  enabled: boolean;
}) {
  const { data: teams } = useGetCoInvestorTeams(enabled);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!teams) return [];
    if (!q) return teams;
    return teams.filter((t) => t.team_name.toLowerCase().includes(q));
  }, [teams, query]);

  return (
    <div className={s.searchable}>
      <SearchInput
        type="search"
        placeholder="Search portfolio teams…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={s.options}>
        {value && (
          <label className={clsx(s.option, s.optionOn)}>
            <input type="radio" checked={true} onChange={() => onChange('')} />
            <span className={s.optionLabel}>{teams?.find((t) => t.team_id === value)?.team_name ?? value}</span>
            <button className={s.clearOne} onClick={() => onChange('')} title="Clear">
              ×
            </button>
          </label>
        )}
        {filtered
          .filter((t) => t.team_id !== value)
          .slice(0, 20)
          .map((t) => (
            <label key={t.team_id} className={s.option}>
              <input type="radio" name="co-team" checked={false} onChange={() => onChange(t.team_id)} />
              <span className={s.optionLabel}>{t.team_name}</span>
            </label>
          ))}
        {!teams && <div className={s.emptyHint}>Loading teams…</div>}
      </div>
    </div>
  );
}

export function InvestorsFilterRail({ tab }: Props) {
  const [filters, setFilters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });
  const access = useInvestorsAccess();
  const savedViews = useSavedViewsStore((s) => s.views);
  const deleteView = useSavedViewsStore((s) => s.actions.deleteView);
  const saveView = useSavedViewsStore((s) => s.actions.saveView);

  const onClear = useCallback(() => {
    setFilters({
      q: null,
      source: null,
      investor_type: null,
      stage_focus: null,
      sector_tags: null,
      geo_focus: null,
      email_status: null,
      engagement_tier: null,
      enrichment_status: null,
      tags: null,
      in_lab_os: null,
      is_co_investor: null,
      co_invested_team_id: null,
      view: null,
      page: null,
    });
  }, [setFilters]);

  const appliedFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.q) n++;
    n += filters.source.length;
    n += filters.investor_type.length;
    n += filters.stage_focus.length;
    n += filters.sector_tags.length;
    if (filters.geo_focus) n++;
    n += filters.email_status.length;
    n += filters.engagement_tier.length;
    n += filters.enrichment_status.length;
    n += filters.tags.length;
    if (filters.in_lab_os) n++;
    return n;
  }, [filters]);

  const handleSaveFromFilter = useCallback(
    (name: string) => {
      const filterParams = {
        q: filters.q || undefined,
        source: filters.source.length ? filters.source : undefined,
        investor_type: filters.investor_type.length ? filters.investor_type : undefined,
        stage_focus: filters.stage_focus.length ? filters.stage_focus : undefined,
        sector_tags: filters.sector_tags.length ? filters.sector_tags : undefined,
        geo_focus: filters.geo_focus || undefined,
        email_status: filters.email_status.length ? filters.email_status : undefined,
        engagement_tier: filters.engagement_tier.length ? filters.engagement_tier : undefined,
        enrichment_status: filters.enrichment_status.length ? filters.enrichment_status : undefined,
        tags: filters.tags.length ? filters.tags : undefined,
        in_lab_os: filters.in_lab_os || undefined,
        is_co_investor: filters.is_co_investor || undefined,
      };
      saveView(name, tab, filterParams as Record<string, unknown>);
    },
    [filters, saveView, tab],
  );

  const showSaveViewInRail = tab === 'all' && appliedFiltersCount > 0 && access.canEdit && !filters.view;

  const userViewsForTab = savedViews.filter((v) => v.tab === tab);
  const showSavedViewsSection = userViewsForTab.length > 0;
  const activeViewId = filters.view;

  const applyView = (id: string, params: Record<string, unknown>) => {
    setFilters({
      q: null,
      source: null,
      investor_type: null,
      stage_focus: null,
      sector_tags: null,
      geo_focus: null,
      email_status: null,
      engagement_tier: null,
      enrichment_status: null,
      tags: null,
      in_lab_os: null,
      is_co_investor: null,
      co_invested_team_id: null,
      page: null,
      ...params,
      view: id,
    } as never);
  };

  // Wraps setFilters for filter changes: always exits saved-view mode.
  const setFilter = useCallback(
    (updates: Parameters<typeof setFilters>[0]) => setFilters({ ...updates, view: null } as never),
    [setFilters],
  );

  return (
    <FiltersSidePanel
      clearParams={onClear}
      appliedFiltersCount={appliedFiltersCount}
      className={s.root}
      hideFooter
      actionsSlot={showSaveViewInRail ? <SaveViewPopover variant="link" onSave={handleSaveFromFilter} /> : undefined}
    >
      {showSavedViewsSection && (
        <FilterSection title="Saved views">
          <div className={s.options}>
            {userViewsForTab.map((v) => (
              <div key={v.id} className={clsx(s.savedView, activeViewId === v.id && s.savedViewActive)}>
                <button className={s.savedViewBody} onClick={() => applyView(v.id, v.params)}>
                  <span className={s.savedViewName}>{v.name}</span>
                </button>
                {access.canEdit && (
                  <button
                    className={s.savedViewDelete}
                    onClick={() => deleteView(v.id)}
                    title="Delete this view"
                    aria-label={`Delete saved view ${v.name}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Search">
        <SearchInput
          type="search"
          placeholder="Name, email, firm…"
          value={filters.q}
          onChange={(e) => setFilter({ q: e.target.value || null, page: 1 })}
        />
      </FilterSection>

      {tab === 'all' && (
        <FilterSection title="Network">
          <label className={clsx(s.option, filters.in_lab_os && s.optionOn)}>
            <input
              type="checkbox"
              checked={filters.in_lab_os}
              onChange={(e) => setFilter({ in_lab_os: e.target.checked || null, page: 1 })}
            />
            <span className={s.optionLabel}>In LabOS</span>
          </label>
          <label className={clsx(s.option, filters.is_co_investor && s.optionOn)}>
            <input
              type="checkbox"
              checked={filters.is_co_investor}
              onChange={(e) => setFilter({ is_co_investor: e.target.checked || null, page: 1 })}
            />
            <span className={s.optionLabel}>Co-invested with PL</span>
          </label>
        </FilterSection>
      )}

      {tab === 'co-investors' && (
        <FilterSection title="Co-invested with team">
          <PortfolioTeamSelect
            value={filters.co_invested_team_id}
            onChange={(next) => setFilter({ co_invested_team_id: next || null, page: 1 })}
            enabled={access.canView}
          />
        </FilterSection>
      )}

      <FilterSection title="Engagement tier">
        <CheckboxOptions
          options={ENGAGEMENT_TIERS}
          values={filters.engagement_tier}
          onChange={(next) => setFilter({ engagement_tier: next.length ? next : null, page: 1 })}
          label={(v) => ENGAGEMENT_TIER_LABEL[v]}
        />
      </FilterSection>

      <FilterSection title="Stage focus">
        <CheckboxOptions
          options={STAGE_FOCUSES}
          values={filters.stage_focus}
          onChange={(next) => setFilter({ stage_focus: next.length ? next : null, page: 1 })}
          label={(v) => STAGE_FOCUS_LABEL[v]}
        />
      </FilterSection>

      <FilterSection title={INDUSTRY_SECTOR_LABEL}>
        <SearchableCheckboxOptions
          options={SECTOR_TAGS}
          values={filters.sector_tags}
          onChange={(next) => setFilter({ sector_tags: next.length ? next : null, page: 1 })}
          label={(v) => SECTOR_TAG_LABEL[v]}
          placeholder="Search industries…"
        />
      </FilterSection>

      <FilterSection title="Investor type">
        <CheckboxOptions
          options={INVESTOR_TYPES}
          values={filters.investor_type}
          onChange={(next) => setFilter({ investor_type: next.length ? next : null, page: 1 })}
          label={(v) => INVESTOR_TYPE_LABEL[v]}
        />
      </FilterSection>

      <FilterSection title="Email status">
        <CheckboxOptions
          options={EMAIL_STATUSES}
          values={filters.email_status}
          onChange={(next) => setFilter({ email_status: next.length ? next : null, page: 1 })}
          label={(v) => EMAIL_STATUS_LABEL[v]}
        />
      </FilterSection>

      <FilterSection title="Geo">
        <SearchInput
          type="text"
          placeholder="US, Europe…"
          value={filters.geo_focus}
          onChange={(e) => setFilter({ geo_focus: e.target.value || null, page: 1 })}
        />
      </FilterSection>

      <FilterSection title="Enrichment status">
        <CheckboxOptions
          options={ENRICHMENT_STATUSES}
          values={filters.enrichment_status}
          onChange={(next) => setFilter({ enrichment_status: next.length ? next : null, page: 1 })}
        />
      </FilterSection>

      <FilterSection title="Source">
        <SearchableCheckboxOptions
          options={SOURCES}
          values={filters.source}
          onChange={(next) => setFilter({ source: next.length ? next : null, page: 1 })}
          placeholder="Search sources…"
        />
      </FilterSection>
    </FiltersSidePanel>
  );
}
