'use client';

import { useQueryStates } from 'nuqs';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { FiltersPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import { InvestorsFilterRail } from '@/components/page/investors/InvestorsFilterRail/InvestorsFilterRail';
// import { WarmIntrosFilterRail } from '@/components/page/investors/WarmIntrosFilterRail/WarmIntrosFilterRail';
import { investorsFilterParsers } from '../searchParams';

export default function InvestorsFiltersContent() {
  const access = useInvestorsAccess();
  const [filters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });

  if (access.isLoading) {
    return <FiltersPanelSkeletonLoader />;
  }

  const isWarmIntros = filters.tab === 'co-investors' && filters.mode === 'warm-intros';
  if (!access.canView || isWarmIntros) {
    return null;
  }

  // const isWarmIntros = filters.tab === 'co-investors' && filters.mode === 'warm-intros';
  // if (isWarmIntros) {
  //   return <WarmIntrosFilterRail />;
  // }

  return <InvestorsFilterRail tab={filters.tab} />;
}
