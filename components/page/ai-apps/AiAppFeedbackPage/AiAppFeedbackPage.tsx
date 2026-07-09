'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/common/Button/Button';
import { ArrowBackIcon } from '@/components/icons';
import { useAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackList';
import { useAiAppFeedbackReviewAccess } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { exportAiAppFeedbackCsv } from './utils/exportAiAppFeedbackCsv';
import { getAvatarColor } from './utils/getAvatarColor';

import s from './AiAppFeedbackPage.module.scss';

const ALL_TAB = 'All apps';

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 1.5V10.5M8 10.5L4.5 7M8 10.5L11.5 7M2.5 13.5H13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function AiAppFeedbackPage() {
  const { feedback, isLoading, isError } = useAiAppFeedbackList();
  const { isDirectoryAdmin } = useAiAppFeedbackReviewAccess();
  const analytics = useAiAppsAnalytics();
  const hasTrackedView = useRef(false);
  const [activeTab, setActiveTab] = useState(ALL_TAB);

  useEffect(() => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;
    analytics.onFeedbackReviewViewed();
  }, [analytics]);

  const appNames = useMemo(() => Array.from(new Set(feedback.map((row) => row.appName))).sort(), [feedback]);

  const tabs = useMemo(
    () => [
      { name: ALL_TAB, count: feedback.length },
      ...appNames.map((name) => ({ name, count: feedback.filter((row) => row.appName === name).length })),
    ],
    [feedback, appNames],
  );

  const visibleRows = activeTab === ALL_TAB ? feedback : feedback.filter((row) => row.appName === activeTab);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    analytics.onFeedbackTabFiltered(tab);
  };

  const handleExport = () => {
    const slug = activeTab.toLowerCase().replace(/\s+/g, '-');
    exportAiAppFeedbackCsv(visibleRows, `ai-app-feedback-${slug}.csv`);
    analytics.onFeedbackExported(visibleRows.length);
  };

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        <Link href="/pl-infra/ai-apps" className={s.backLink}>
          <ArrowBackIcon width={16} height={16} />
          Back to AI Apps
        </Link>

        <div className={s.titleBlock}>
          <h1 className={s.title}>{isDirectoryAdmin ? 'All app feedback' : 'Feedback on your apps'}</h1>
          <p className={s.subtitle}>
            {isDirectoryAdmin
              ? 'Every app across the directory.'
              : 'Only the apps you build — not every app on the page.'}
          </p>
        </div>

        {isLoading ? (
          <div className={s.state}>Loading feedback…</div>
        ) : isError ? (
          <div className={s.state}>Unable to load feedback. Please try again later.</div>
        ) : feedback.length === 0 ? (
          <div className={s.state}>No feedback has been submitted yet.</div>
        ) : (
          <>
            <div className={s.tabsRow}>
              <div className={s.tabs}>
                {tabs.map((tab) => (
                  <button
                    key={tab.name}
                    type="button"
                    className={clsx(s.tab, { [s.tabActive]: tab.name === activeTab })}
                    onClick={() => handleTabClick(tab.name)}
                  >
                    {tab.name}
                    <span className={s.tabCount}>{tab.count}</span>
                    {tab.name === activeTab && (
                      <motion.span
                        layoutId="aiAppFeedbackActiveTab"
                        className={s.activeIndicator}
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <Button
                size="s"
                style="fill"
                variant="primary"
                onClick={handleExport}
                disabled={visibleRows.length === 0}
                className={s.exportButton}
              >
                <DownloadIcon />
                Export CSV
              </Button>
            </div>

            {visibleRows.length === 0 ? (
              <div className={s.state}>No feedback for this app yet.</div>
            ) : (
              <div className={s.tableWrapper}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>App</th>
                      <th>Feedback</th>
                      <th>From</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => {
                      const submitterName = row.member?.name ?? 'Unknown member';
                      return (
                        <tr key={row.uid}>
                          <td className={s.appNameCell}>{row.appName}</td>
                          <td className={s.messageCell}>{row.text}</td>
                          <td>
                            <div className={s.submitter}>
                              <span className={s.avatar} style={{ background: getAvatarColor(submitterName) }}>
                                {submitterName.charAt(0).toUpperCase()}
                              </span>
                              {submitterName}
                            </div>
                          </td>
                          <td className={s.dateCell}>
                            {new Date(row.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
