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

  // Hide the rail entirely when:
  //  - the user can't view the page (landing covers the explanation), or
  //  - we're in the warm-intros workspace mode (it has its own builder UI)
  const isWarmIntros = filters.tab === 'co-investors' && filters.mode === 'warm-intros';
  if (!access.canView || isWarmIntros) {
    return null;
  }

  return <InvestorsFilterRail tab={filters.tab} />;
}
