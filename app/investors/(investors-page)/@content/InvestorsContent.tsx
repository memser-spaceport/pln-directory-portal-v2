'use client';

import { useEffect } from 'react';
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

const VISUAL_TABS = [
  { value: 'all', label: 'All Investors' },
  { value: 'co-investors', label: 'Co-investors' },
  { value: 'warm-intros', label: 'Warm Intros' },
];

export default function InvestorsContent() {
  const access = useInvestorsAccess();
  const router = useRouter();

  useEffect(() => {
    if (!access.isLoading && !access.canView) {
      router.replace('/members');
    }
  }, [access.isLoading, access.canView, router]);

  const [filters, setFilters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });

  if (access.isLoading) {
    return <ContentPanelSkeletonLoader />;
  }
  if (access.isError) {
    return <Error />;
  }
  if (!access.canView) {
    return null;
  }

  const isWarmIntros = filters.tab === 'co-investors' && filters.mode === 'warm-intros';

  const activeVisualTab = isWarmIntros ? 'warm-intros' : filters.tab;

  const handleVisualTabChange = (next: string) => {
    if (next === 'warm-intros') {
      setFilters({ tab: 'co-investors', mode: 'warm-intros', investorId: null });
    } else {
      setFilters({
        tab: next as 'all' | 'co-investors',
        page: 1,
        mode: null,
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
          <span className={s.internalBadge}>Internal · PL investment team</span>
        </div>
        <p className={s.pageSubtitle}>
          Internal Investors database — Network, co-investors, and outreach pipeline.
        </p>
      </div>

      <div className={s.body}>
        {isWarmIntros ? (
          <div className={s.warmIntrosView}>
            <div className={s.warmIntrosTabBar}>
              <Tabs tabs={VISUAL_TABS} value={activeVisualTab} onValueChange={handleVisualTabChange} variant="underline" />
            </div>
            <WarmIntrosWorkspace />
          </div>
        ) : filters.tab === 'all' ? (
          <InvestorsTableSection
            tab="all"
            tabs={VISUAL_TABS}
            activeTab={activeVisualTab}
            onTabChange={handleVisualTabChange}
          />
        ) : (
          <InvestorsTableSection
            tab="co-investors"
            tabs={VISUAL_TABS}
            activeTab={activeVisualTab}
            onTabChange={handleVisualTabChange}
            tabDefaults={{ is_co_investor: true }}
            enableSaveView={false}
          />
        )}
      </div>

      <InvestorDrawer access={access} />
    </div>
  );
}
