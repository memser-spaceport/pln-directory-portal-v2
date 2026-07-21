'use client';

import { useEffect, useMemo, useState } from 'react';

import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { CheckboxListItemRepresentation } from '@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { ArrowBackIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

import page from '@/components/page/ai-apps/AiAppsPage/AiAppsPage.module.scss';
// Export button reused from the investors table.
import its from '@/components/page/investors/InvestorsTableSection/InvestorsTableSection.module.scss';
import { FEEDBACK_TYPES, type FeedbackEntry, type FeedbackType } from './mocks';
import s from './feedback.module.scss';

interface Props {
  /** Apps in scope for this viewer (author: own apps; admin: all apps). */
  scopedApps: AiApp[];
  feedback: FeedbackEntry[];
  isAdmin: boolean;
  /** Pre-select an app filter (e.g. arrived from an app detail page). */
  initialAppFilter?: string | null;
  onBack: () => void;
}

type Recency = 'all' | '7d' | '30d';

const RECENCY_OPTIONS: { value: Recency; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

const TYPE_CLASS: Record<FeedbackType, string> = {
  feature: s.typeFeature,
  bug: s.typeBug,
  praise: s.typePraise,
};

const typeLabel = (t: FeedbackType) => FEEDBACK_TYPES.find((x) => x.value === t)?.label ?? t;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function toCsv(rows: FeedbackEntry[]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ['App', 'Type', 'Feedback', 'From', 'Date'];
  const lines = rows.map((r) =>
    [r.appName, typeLabel(r.type), r.text, r.authorName, formatDate(r.createdAt)].map(escape).join(','),
  );
  return [header.map(escape).join(','), ...lines].join('\n');
}

const ExportIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 15V3" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
  </svg>
);

/**
 * Full received-feedback view, laid out with the production `DashboardPagesLayout`
 * (flush-left, full-height filter rail + content) — the same shell the Members /
 * Teams pages use. The rail is a `FiltersSidePanel` holding four facets built from
 * the DS filter pieces: a feedback search, the App checkbox list, and a recency
 * filter. Every facet is multi-select (Date is single-select);
 * an empty selection means "no filter", like production. Below the rail's
 * breakpoint the same facets stack above the table.
 */
export function FeedbackPage({ scopedApps, feedback, isAdmin, initialAppFilter, onBack }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() =>
    initialAppFilter ? new Set([initialAppFilter]) : new Set(),
  );
  const [appQuery, setAppQuery] = useState('');
  const [noteQuery, setNoteQuery] = useState('');
  const [recency, setRecency] = useState<Recency>('all');
  // Stable "now" for recency buckets. This view only renders client-side (behind a
  // "View feedback" click), so it never SSRs — Date.now() is safe here.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    setSelected(initialAppFilter ? new Set([initialAppFilter]) : new Set());
  }, [initialAppFilter]);

  const within = (iso: string, days: number) => now - new Date(iso).getTime() <= days * 86_400_000;

  const rows = useMemo(() => {
    const q = noteQuery.trim().toLowerCase();
    let list = [...feedback].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (selected.size) list = list.filter((f) => selected.has(f.appUid));
    if (recency !== 'all') list = list.filter((f) => within(f.createdAt, recency === '7d' ? 7 : 30));
    if (q) {
      list = list.filter(
        (f) =>
          f.text.toLowerCase().includes(q) ||
          f.authorName.toLowerCase().includes(q) ||
          f.appName.toLowerCase().includes(q),
      );
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback, selected, recency, noteQuery, now]);

  // One checkbox row per scoped app, its feedback count shown as the badge.
  const appOptions = useMemo(
    () =>
      scopedApps.map((app) => ({
        value: app.uid,
        label: app.name,
        count: feedback.filter((f) => f.appUid === app.uid).length,
      })),
    [scopedApps, feedback],
  );

  const visibleApps = useMemo(() => {
    const q = appQuery.trim().toLowerCase();
    if (!q) return appOptions;
    return appOptions.filter((a) => a.label.toLowerCase().includes(q));
  }, [appOptions, appQuery]);

  const recencyOptions = RECENCY_OPTIONS.map((r) => ({
    ...r,
    count:
      r.value === 'all' ? feedback.length : feedback.filter((f) => within(f.createdAt, r.value === '7d' ? 7 : 30)).length,
  }));

  // Ownership signal: whose feedback this is. Fixed by role — the facets narrow
  // the table, not the page's identity.
  const title = isAdmin ? 'All app feedback' : 'Feedback on your apps';
  const subtitle = isAdmin ? 'Every app across the directory.' : 'Only the apps you build — not every app on the page.';

  const toggle = (uid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });

  const appliedFiltersCount = selected.size + (recency !== 'all' ? 1 : 0) + (noteQuery.trim() ? 1 : 0);

  const clearAll = () => {
    setSelected(new Set());
    setRecency('all');
    setNoteQuery('');
    setAppQuery('');
  };

  const handleExport = () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-apps-feedback${selected.size === 1 ? `-${[...selected][0]}` : ''}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // The facets, reused by the desktop rail and the below-breakpoint stack.
  const filterBody = (
    <>
      <FilterSection title="Search">
        <SearchInput value={noteQuery} onChange={setNoteQuery} placeholder="Search feedback or author…" />
      </FilterSection>

      <FilterSection title="App">
        <SearchInput value={appQuery} onChange={setAppQuery} placeholder="Search apps…" />
        <div className={s.filterList}>
          {visibleApps.length === 0 ? (
            <div className={s.filterEmpty}>No apps match “{appQuery.trim()}”.</div>
          ) : (
            visibleApps.map((a) => (
              <CheckboxListItemRepresentation
                key={a.value}
                label={a.label}
                count={a.count}
                checked={selected.has(a.value)}
                onClick={() => toggle(a.value)}
              />
            ))
          )}
        </div>
      </FilterSection>

      <FilterSection title="Date">
        <div className={s.filterList}>
          {recencyOptions.map((r) => (
            <CheckboxListItemRepresentation
              key={r.value}
              label={r.label}
              count={r.count}
              checked={recency === r.value}
              onClick={() => setRecency(r.value)}
            />
          ))}
        </div>
      </FilterSection>
    </>
  );

  // Flush-left rail (dev "Filters / Clear All" shell), shown by the layout ≥1024px.
  const rail = (
    <FiltersSidePanel clearParams={clearAll} appliedFiltersCount={appliedFiltersCount} hideFooter>
      {filterBody}
    </FiltersSidePanel>
  );

  const content = (
    <div className={s.feedbackContent}>
      <button type="button" className={s.linkButton} onClick={onBack}>
        <ArrowBackIcon width={16} height={16} />
        Back to all
      </button>

      <div className={s.headerRow}>
        <div className={`${page.titleBlock} ${s.headerTitle}`}>
          {/* Count folded into the title, dev-style: "Title (N)" — muted, in parens. */}
          <div className={s.titleRow}>
            <h1 className={page.title}>{title}</h1>
            <span className={s.titleCount}>({rows.length})</span>
          </div>
          <p className={page.description}>{subtitle}</p>
        </div>
        {isAdmin && (
          <div className={s.headerActions}>
            <button type="button" className={its.exportBtn} onClick={handleExport} disabled={rows.length === 0}>
              <ExportIcon />
              <span className={its.exportBtnLabel}>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Below the layout's rail breakpoint the rail is hidden — stack the facets here. */}
      <div className={s.mobileFilter}>
        {filterBody}
        {appliedFiltersCount > 0 && (
          <button type="button" className={s.clearBtn} onClick={clearAll}>
            Clear all ({appliedFiltersCount})
          </button>
        )}
      </div>

      <div className={s.pageCard}>
        {rows.length === 0 ? (
          <div className={s.pageEmpty}>
            {appliedFiltersCount > 0 ? 'No feedback matches these filters.' : 'No feedback yet.'}
          </div>
        ) : (
          <>
            {/* Table on ≥640px */}
            <table className={s.table}>
              <thead>
                <tr>
                  <th className={s.th}>App</th>
                  <th className={s.th}>Feedback</th>
                  <th className={s.th}>From</th>
                  <th className={s.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={s.tr}>
                    <td className={`${s.td} ${s.tdApp}`}>{r.appName}</td>
                    <td className={`${s.td} ${s.tdText}`}>
                      <span className={`${s.typeTag} ${TYPE_CLASS[r.type]}`}>{typeLabel(r.type)}</span>
                      <span>{r.text}</span>
                    </td>
                    <td className={s.td}>
                      <span className={s.fromCell}>
                        <img className={s.fromAvatar} src={getDefaultAvatar(r.authorName)} alt="" />
                        {r.authorName}
                      </span>
                    </td>
                    <td className={`${s.td} ${s.tdDate}`}>{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Cards on mobile (<640px) */}
            <ul className={s.cardList}>
              {rows.map((r) => (
                <li key={r.id} className={s.card}>
                  <div className={s.cardHead}>
                    <span className={s.cardApp}>{r.appName}</span>
                    <span className={s.cardDate}>{formatDate(r.createdAt)}</span>
                  </div>
                  <span className={`${s.typeTag} ${TYPE_CLASS[r.type]}`}>{typeLabel(r.type)}</span>
                  <p className={s.cardText}>{r.text}</p>
                  <div className={s.cardFrom}>
                    <img className={s.fromAvatar} src={getDefaultAvatar(r.authorName)} alt="" />
                    {r.authorName}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );

  return <DashboardPagesLayout filters={rail} content={content} />;
}
