'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Tabs } from '@/components/ui/tabs/Tabs/Tabs';
import { Button } from '@/components/common/Button/Button';
import { useAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackList';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { exportAiAppFeedbackCsv } from './utils/exportAiAppFeedbackCsv';

import s from './AiAppFeedbackPage.module.scss';

const ALL_TAB = 'All';

export function AiAppFeedbackPage() {
  const { feedback, isLoading, isError } = useAiAppFeedbackList();
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

  if (isLoading) {
    return <div className={s.state}>Loading feedback…</div>;
  }

  if (isError) {
    return <div className={s.state}>Unable to load feedback. Please try again later.</div>;
  }

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        <div className={s.header}>
          <h1 className={s.title}>App feedback</h1>
          <Button size="s" style="border" variant="neutral" onClick={handleExport} disabled={visibleRows.length === 0}>
            Export (CSV)
          </Button>
        </div>

        {feedback.length === 0 ? (
          <div className={s.state}>No feedback has been submitted yet.</div>
        ) : (
          <>
            <Tabs tabs={tabs} activeTab={activeTab} onTabClick={handleTabClick} variant="secondary" />

            {visibleRows.length === 0 ? (
              <div className={s.state}>No feedback for this app yet.</div>
            ) : (
              <div className={s.list}>
                {visibleRows.map((row) => (
                  <div key={row.uid} className={s.row}>
                    <div className={s.rowHeader}>
                      <span className={s.appName}>{row.appName}</span>
                      <span className={s.date}>{new Date(row.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className={s.message}>{row.text}</p>
                    <span className={s.submitter}>{row.member?.name ?? 'Unknown member'}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
