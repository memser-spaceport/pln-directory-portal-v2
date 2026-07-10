'use client';

import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';

import { Tabs } from '@/components/common/Tabs/Tabs';
import { Badge } from '@/components/common/Badge';
import { ArrowBackIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

import page from '@/components/page/ai-apps/AiAppsPage/AiAppsPage.module.scss';
// Filter tabs match the newsfeed 1:1 (Badge counts + tabsList underline track).
import tnt from '@/components/page/home/TeamNews/components/TeamNewsTabs/TeamNewsTabs.module.scss';
// Export button reused from the investors table.
import its from '@/components/page/investors/InvestorsTableSection/InvestorsTableSection.module.scss';
import type { FeedbackEntry } from './mocks';
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function toCsv(rows: FeedbackEntry[]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ['App', 'Feedback', 'From', 'Date'];
  const lines = rows.map((r) => [r.appName, r.text, r.authorName, formatDate(r.createdAt)].map(escape).join(','));
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
 * Full received-feedback view as its own page. Reuses the investors table's
 * pattern: shared Tabs filters + the blue Export CSV button, side by side.
 */
export function FeedbackPage({ scopedApps, feedback, isAdmin, initialAppFilter, onBack }: Props) {
  const [appFilter, setAppFilter] = useState<string>(initialAppFilter ?? 'all');

  useEffect(() => {
    setAppFilter(initialAppFilter ?? 'all');
  }, [initialAppFilter]);

  const rows = useMemo(() => {
    const sorted = [...feedback].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return appFilter === 'all' ? sorted : sorted.filter((f) => f.appUid === appFilter);
  }, [feedback, appFilter]);

  // Ownership signal: whose feedback this is. Stays fixed by role — the filter
  // tabs narrow the table, not the page's identity.
  const title = isAdmin ? 'All app feedback' : 'Feedback on your apps';
  const subtitle = isAdmin
    ? 'Every app across the directory.'
    : 'Only the apps you build — not every app on the page.';

  const tabs = [
    { value: 'all', label: 'All apps', count: feedback.length },
    ...scopedApps.map((app) => ({
      value: app.uid,
      label: app.name,
      count: feedback.filter((f) => f.appUid === app.uid).length,
    })),
  ].map((t) => {
    const isActive = appFilter === t.value;
    return {
      value: t.value,
      label: t.label,
      badge:
        t.count > 0 ? (
          <Badge
            variant={isActive ? 'brand' : 'default'}
            noBorder={!isActive}
            className={clsx({ [tnt.defaultBadge]: !isActive })}
          >
            {t.count}
          </Badge>
        ) : undefined,
    };
  });

  const handleExport = () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-apps-feedback${appFilter === 'all' ? '' : `-${appFilter}`}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={s.pageWrap}>
      <button type="button" className={s.linkButton} onClick={onBack}>
        <ArrowBackIcon width={16} height={16} />
        Back to AI Apps
      </button>

      <div className={page.titleBlock}>
        <h1 className={page.title}>{title}</h1>
        <p className={page.description}>{subtitle}</p>
      </div>

      <div className={s.pageToolbar}>
        <Tabs tabs={tabs} value={appFilter} onValueChange={setAppFilter} />
        <button type="button" className={its.exportBtn} onClick={handleExport} disabled={rows.length === 0}>
          <ExportIcon />
          <span className={its.exportBtnLabel}>Export CSV</span>
        </button>
      </div>

      <div className={s.pageCard}>
        {rows.length === 0 ? (
          <div className={s.pageEmpty}>No feedback yet.</div>
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
                    <td className={`${s.td} ${s.tdText}`}>{r.text}</td>
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
}
