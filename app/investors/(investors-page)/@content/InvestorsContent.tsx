'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMount, useToggle } from 'react-use';
import { useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { Tabs } from '@/components/common/Tabs/Tabs';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { ContentPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import Error from '@/components/core/error';
import { investorsFilterParsers } from '../searchParams';
import { InvestorsTableSection } from '@/components/page/investors/InvestorsTableSection/InvestorsTableSection';
import { WarmIntrosWorkspace } from '@/components/page/investors/WarmIntrosWorkspace/WarmIntrosWorkspace';
import { InvestorDrawer } from '@/components/page/investors/InvestorDrawer/InvestorDrawer';
import s from './page.module.scss';

// Lists IA: Co-investors tab retired (now the relationship filter on All
// Investors). IA = All Investors (universe) + Warm Intros (proximity workspace).
const VISUAL_TABS = [
  { value: 'warm-intros', label: 'Warm Intros' },
  { value: 'all', label: 'All Investors' },
];

export default function InvestorsContent() {
  const [mounted, toggleMounted] = useToggle(false);

  useMount(() => toggleMounted());

  const access = useInvestorsAccess();
  const router = useRouter();

  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const updateTabCount = useCallback((tab: string, count: number) => {
    setTabCounts((prev) => (prev[tab] === count ? prev : { ...prev, [tab]: count }));
  }, []);

  useEffect(() => {
    if (!access.isLoading && !access.canView) {
      router.replace('/members');
    }
  }, [access.isLoading, access.canView, router]);

  const [filters, setFilters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });

  if (!mounted || access.isLoading) {
    return mounted ? <ContentPanelSkeletonLoader /> : null;
  }

  if (access.isError) {
    return <Error />;
  }
  if (!access.canView) {
    return null;
  }

  const isWarmIntros = filters.mode === 'warm-intros';
  const activeVisualTab = isWarmIntros ? 'warm-intros' : 'all';

  const visualTabs = VISUAL_TABS.map((t) =>
    tabCounts[t.value] !== undefined ? { ...t, badge: tabCounts[t.value].toLocaleString() } : t,
  );

  const handleVisualTabChange = (next: string) => {
    if (next === 'warm-intros') {
      setFilters({ tab: 'all', mode: 'warm-intros', investorId: null });
    } else {
      setFilters({
        tab: 'all',
        page: 1,
        mode: 'list',
        in_lab_os: null,
        is_co_investor: null,
        co_invested_team_id: null,
        view: null,
      });
    }
  };

  return (
    <div className={s.root}>
      <div className={s.pageHeader}>
        <div className={s.pageTitleRow}>
          <h1 className={s.pageTitle}>Investors Database</h1>
          <span className={s.internalBadge}>Access Restricted to - PL investment team</span>
        </div>
        <p className={s.pageSubtitle}>Internal Investors database — Network, co-investors, and outreach pipeline.</p>
      </div>

      <div className={s.body}>
        {isWarmIntros ? (
          <div className={s.warmIntrosView}>
            <div className={s.warmIntrosTabBar}>
              <Tabs
                tabs={visualTabs}
                value={activeVisualTab}
                onValueChange={handleVisualTabChange}
                variant="underline"
                classes={{ tab: s.tab, badge: s.tabBadge }}
              />
            </div>
            <WarmIntrosWorkspace onCountChange={(n) => updateTabCount('warm-intros', n)} />
          </div>
        ) : (
          <InvestorsTableSection
            tab="all"
            tabs={visualTabs}
            activeTab={activeVisualTab}
            onTabChange={handleVisualTabChange}
            onCountChange={(n) => updateTabCount('all', n)}
          />
        )}
      </div>

      <InvestorDrawer access={access} />
    </div>
  );
}
