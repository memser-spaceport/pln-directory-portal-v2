'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { useFoundersAccess } from '@/services/rbac/hooks/useFoundersAccess';
import { useGetKpiSummary } from '@/services/founders/hooks/useGetKpiSummary';
import { foundersFilterParsers } from '../searchParams';
import FoundersTableSection from '@/components/page/founders/FoundersTableSection/FoundersTableSection';
import KpiSummaryStrip from '@/components/page/founders/KpiSummaryStrip/KpiSummaryStrip';
import FounderDrawer from '@/components/page/founders/FounderDrawer/FounderDrawer';
import { useFoundersAnalytics } from '@/analytics/founders.analytics';

export default function FoundersContent() {
  const router = useRouter();
  const access = useFoundersAccess();
  const [filters, setFilters] = useQueryStates(foundersFilterParsers, { history: 'replace', shallow: true });
  const { data: kpiSummary, isLoading: kpiLoading } = useGetKpiSummary(4, access.canView);
  const analytics = useFoundersAnalytics();

  useEffect(() => {
    if (access.canView) analytics.onPageViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.canView]);

  if (!access.isLoading && !access.canView) {
    router.replace('/members');
    return null;
  }

  return (
    <>
      <KpiSummaryStrip data={kpiSummary} isLoading={kpiLoading} />
      <FoundersTableSection filters={filters} setFilters={setFilters} canEdit={access.canEdit} canView={access.canView} />
      <FounderDrawer
        founderId={filters.founderId || null}
        onClose={() => setFilters({ founderId: '' }, { history: 'push' } as never)}
        canEdit={access.canEdit}
      />
    </>
  );
}
