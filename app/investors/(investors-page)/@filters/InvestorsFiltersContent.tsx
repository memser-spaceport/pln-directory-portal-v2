'use client';

import { useQueryStates } from 'nuqs';
import { useMount, useToggle } from 'react-use';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { FiltersPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import { InvestorsFilterRail } from '@/components/page/investors/InvestorsFilterRail/InvestorsFilterRail';
import { investorsFilterParsers } from '../searchParams';

export default function InvestorsFiltersContent() {
  const [mounted, toggleMounted] = useToggle(false);

  useMount(() => toggleMounted());

  const access = useInvestorsAccess();
  const [filters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });

  if (!mounted || access.isLoading) {
    return mounted ? <FiltersPanelSkeletonLoader /> : null;
  }

  // Warm Intros (v1 + v2) carry their own filter UI in the workspace, so the
  // side rail is hidden there. (Lists IA: the old co-investors tab is retired.)
  const isWarmIntros = filters.mode === 'warm-intros' || filters.mode === 'warm-intros-v2';
  if (!access.canView || isWarmIntros) {
    return null;
  }

  return <InvestorsFilterRail tab={filters.tab} />;
}
