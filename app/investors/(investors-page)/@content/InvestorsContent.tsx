'use client';

import { useQueryStates } from 'nuqs';
import clsx from 'clsx';
import { Tabs } from '@/components/common/Tabs/Tabs';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { ContentPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import Error from '@/components/core/error';
import { getUserInfoFromLocal } from '@/utils/common.utils';
import { investorsFilterParsers } from '../searchParams';
import { INVESTOR_TAB_LABEL, INVESTOR_TAB_VALUES } from '@/services/investors/constants';
import { InvestorsTableSection } from '@/components/page/investors/InvestorsTableSection/InvestorsTableSection';
import { WarmIntrosWorkspace } from '@/components/page/investors/WarmIntrosWorkspace/WarmIntrosWorkspace';
import { InvestorsLandingPage } from '@/components/page/investors/InvestorsLandingPage/InvestorsLandingPage';
import { InvestorsNoAccessModal } from '@/components/page/investors/InvestorsNoAccessModal/InvestorsNoAccessModal';
import { InvestorDrawer } from '@/components/page/investors/InvestorDrawer/InvestorDrawer';
import s from './page.module.scss';

export default function InvestorsContent() {
  const access = useInvestorsAccess();
  const isLoggedIn = !!getUserInfoFromLocal();

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
    return (
      <>
        <InvestorsLandingPage />
        {isLoggedIn && <InvestorsNoAccessModal />}
      </>
    );
  }

  const tabs = INVESTOR_TAB_VALUES.map((value) => ({ value, label: INVESTOR_TAB_LABEL[value] }));

  const handleTabChange = (next: string) => {
    setFilters({
      tab: next as 'all' | 'co-investors',
      page: 1,
      mode: null, // reset co-investors mode when switching tabs
      // Reset cross-cutting flags so each tab starts fresh
      in_lab_os: null,
      is_co_investor: null,
      co_invested_team_id: null,
      view: null,
    });
  };

  // "Find warm intros" CTA — visible on Co-investors tab, toggles mode in URL
  const goToWarmIntros = () => setFilters({ mode: 'warm-intros', investorId: null });
  const goToCoInvestorsList = () => setFilters({ mode: 'list' });

  return (
    <div className={s.root}>
      <header className={s.header}>
        <div className={s.tabRow}>
          <Tabs tabs={tabs} value={filters.tab} onValueChange={handleTabChange} variant="underline" />
          <span className={s.internal}>Internal · PL investment team</span>
        </div>
      </header>

      <div className={s.body}>
        {filters.tab === 'all' && <InvestorsTableSection tab="all" title="All Investors" />}

        {filters.tab === 'co-investors' && filters.mode === 'warm-intros' && (
          <div>
            <button className={s.backLink} onClick={goToCoInvestorsList}>
              ← Back to co-investors list
            </button>
            <WarmIntrosWorkspace />
          </div>
        )}

        {filters.tab === 'co-investors' && filters.mode !== 'warm-intros' && (
          <InvestorsTableSection
            tab="co-investors"
            title="Co-investors"
            tabDefaults={{ is_co_investor: true }}
            enableSaveView={false}
            toolbarRightSlot={
              <button className={clsx(s.cta, s.ctaPrimary)} onClick={goToWarmIntros} type="button">
                ⚡ Find warm intros
              </button>
            }
          />
        )}
      </div>

      <InvestorDrawer access={access} />
    </div>
  );
}
