'use client';

import { createFilterGetter } from '@/services/teams/utils/createFilterGetter';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { FilterSearchInput } from '@/components/common/filters/FilterSearchInput';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';
import type { FilterStoreHook } from '@/services/filters/types';
import type { AiAppFeedbackRow } from '@/services/ai-app-feedback/ai-app-feedback.service';
import {
  AI_APP_FEEDBACK_PRIORITY_LABELS,
  AI_APP_FEEDBACK_REPORT_KINDS,
  AI_APP_FEEDBACK_STATUSES,
  AI_APP_FEEDBACK_STATUS_LABELS,
} from '@/services/ai-app-feedback/constants';

import { FEEDBACK_PARAM, countAppliedFeedbackFilters, useMockFeedbackFilterStore } from './mockFeedbackFilterStore';

interface Props {
  /** The active tab's rows; every option and count comes off them. */
  rows: AiAppFeedbackRow[];
  /** The App section's options: on Received the apps you admin (quiet ones too), on Given the apps in your rows. */
  appNames: string[];
  /** Received has a From section; on Given every row is yours. */
  showFrom: boolean;
  onClose?: () => void;
}

type Item = { value: string; disabled: boolean; count: number };

const store = useMockFeedbackFilterStore as unknown as FilterStoreHook;

const capitalize = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

/**
 * The Feedback page's filters, on the left like every other list in the product
 * (2026-10-06; they were SortDropdowns in the tab row). Built the way the AI
 * Apps grid, Members and Teams build theirs: `FiltersSidePanel` (heading, applied
 * count, Clear All), a title-less search, then one `FilterSection` per facet.
 *
 * Order follows triage: what it is (Type, App), where it stands (Status), then
 * the reporter's own labels (Kind, Priority), then who sent it.
 */
export function FeedbackFilterView({ rows, appNames, showFrom, onClose }: Props) {
  const { params, clearParams } = useMockFeedbackFilterStore();

  const count = (pred: (r: AiAppFeedbackRow) => boolean) => rows.filter(pred).length;
  const item = (value: string, n: number): Item => ({ value, disabled: false, count: n });

  const types = [
    item(
      'FEEDBACK',
      count((r) => r.kind !== 'COMMENT'),
    ),
    item(
      'COMMENT',
      count((r) => r.kind === 'COMMENT'),
    ),
  ];
  const apps = appNames.map((name) =>
    item(
      name,
      count((r) => r.appName === name),
    ),
  );
  const statuses = AI_APP_FEEDBACK_STATUSES.map((st) =>
    item(
      st,
      count((r) => r.status === st),
    ),
  );
  const kinds = AI_APP_FEEDBACK_REPORT_KINDS.map((k) =>
    item(
      k,
      count((r) => r.reportKind === k),
    ),
  );
  const priorities = Object.keys(AI_APP_FEEDBACK_PRIORITY_LABELS).map((p) =>
    item(
      p,
      count((r) => r.priority === p),
    ),
  );
  const people = Array.from(new Set(rows.map((r) => r.member?.name).filter(Boolean) as string[]))
    .sort((a, b) => a.localeCompare(b))
    .map((name) =>
      item(
        name,
        count((r) => r.member?.name === name),
      ),
    );

  const priorityLabel = (p: string) => {
    const [code, name] = (AI_APP_FEEDBACK_PRIORITY_LABELS as Record<string, string>)[p].split(' — ');
    return `${code} · ${name}`;
  };

  return (
    <FiltersSidePanel
      onClose={onClose}
      clearParams={clearParams}
      appliedFiltersCount={countAppliedFeedbackFilters(params)}
    >
      <FilterSection>
        <FilterSearchInput
          filterStore={store}
          paramKey={FEEDBACK_PARAM.SEARCH}
          label="Search feedback"
          placeholder="Search by text"
          debounceMs={300}
        />
      </FilterSection>

      <FilterSection title="Type">
        <GenericCheckboxList
          paramKey={FEEDBACK_PARAM.TYPE}
          hideSearch
          disableSorting
          filterStore={useMockFeedbackFilterStore}
          useGetDataHook={createFilterGetter(types, {
            formatLabel: (t) => (t.value === 'COMMENT' ? 'Comments' : 'Feedback'),
          })}
          defaultItemsToShow={2}
        />
      </FilterSection>

      {appNames.length > 1 && (
        <FilterSection title="App">
          <GenericCheckboxList
            label="Search or select an app"
            paramKey={FEEDBACK_PARAM.APP}
            filterStore={useMockFeedbackFilterStore}
            placeholder="E.g. Warm Intro Matcher"
            useGetDataHook={createFilterGetter(apps)}
            defaultItemsToShow={5}
          />
        </FilterSection>
      )}

      <FilterSection title="Status">
        <GenericCheckboxList
          paramKey={FEEDBACK_PARAM.STATUS}
          hideSearch
          disableSorting
          filterStore={useMockFeedbackFilterStore}
          useGetDataHook={createFilterGetter(statuses, {
            formatLabel: (st) => AI_APP_FEEDBACK_STATUS_LABELS[st.value as keyof typeof AI_APP_FEEDBACK_STATUS_LABELS],
          })}
          defaultItemsToShow={3}
        />
      </FilterSection>

      <FilterSection title="Kind">
        <GenericCheckboxList
          paramKey={FEEDBACK_PARAM.KIND}
          hideSearch
          disableSorting
          filterStore={useMockFeedbackFilterStore}
          useGetDataHook={createFilterGetter(kinds, { formatLabel: (k) => capitalize(k.value) })}
          defaultItemsToShow={4}
        />
      </FilterSection>

      <FilterSection title="Priority">
        <GenericCheckboxList
          paramKey={FEEDBACK_PARAM.PRIORITY}
          hideSearch
          disableSorting
          filterStore={useMockFeedbackFilterStore}
          useGetDataHook={createFilterGetter(priorities, { formatLabel: (p) => priorityLabel(p.value) })}
          defaultItemsToShow={4}
        />
      </FilterSection>

      {showFrom && people.length > 0 && (
        <FilterSection title="From">
          <GenericCheckboxList
            label="Search or select a person"
            paramKey={FEEDBACK_PARAM.FROM}
            filterStore={useMockFeedbackFilterStore}
            placeholder="E.g. Nina Chen"
            useGetDataHook={createFilterGetter(people)}
            defaultItemsToShow={5}
          />
        </FilterSection>
      )}
    </FiltersSidePanel>
  );
}
