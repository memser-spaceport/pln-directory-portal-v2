'use client';

import { useQueryStates } from 'nuqs';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { FiltersPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import { InvestorsFilterRail } from '@/components/page/investors/InvestorsFilterRail/InvestorsFilterRail';
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

  // Warm Intros carries its own filter UI in the workspace, so the side rail is
  // hidden there. (Lists IA: the old co-investors tab is retired.)
  const isWarmIntros = filters.mode === 'warm-intros';
  if (!access.canView || isWarmIntros) {
    return null;
  }

  return <InvestorsFilterRail tab={filters.tab} />;
}
