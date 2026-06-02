'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { useFoundersAccess } from '@/services/rbac/hooks/useFoundersAccess';
import { useGetKpiSummary } from '@/services/founders/hooks/useGetKpiSummary';
import { ContentPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import { foundersFilterParsers } from '../searchParams';
import FoundersTableSection from '@/components/page/founders/FoundersTableSection/FoundersTableSection';
import KpiSummaryStrip from '@/components/page/founders/KpiSummaryStrip/KpiSummaryStrip';
import FounderDrawer from '@/components/page/founders/FounderDrawer/FounderDrawer';
import { useFoundersAnalytics } from '@/analytics/founders.analytics';
import s from './page.module.scss';

export default function FoundersContent() {
  const router = useRouter();
  const access = useFoundersAccess();
  const [filters, setFilters] = useQueryStates(foundersFilterParsers, { history: 'replace', shallow: true });
  const { data: kpiSummary, isLoading: kpiLoading } = useGetKpiSummary(4, access.canView);
  const analytics = useFoundersAnalytics();

  useEffect(() => {
    if (!access.isLoading && !access.canView) {
      router.replace('/members');
    }
  }, [access.isLoading, access.canView, router]);

  useEffect(() => {
    if (access.canView) analytics.onPageViewed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.canView]);

  if (access.isLoading) {
    return <ContentPanelSkeletonLoader />;
  }
  if (!access.canView) {
    return null;
  }

  return (
    <div className={s.root}>
      <div className={s.pageHeader}>
        <div className={s.pageTitleRow}>
          <h1 className={s.pageTitle}>Founder DB</h1>
          <span className={s.internalBadge}>Access Restricted to - PL investment team</span>
        </div>
        <p className={s.pageSubtitle}>Database to determine qualified founders.</p>
      </div>

      <KpiSummaryStrip data={kpiSummary} isLoading={kpiLoading} />

      <div className={s.body}>
        <FoundersTableSection
          filters={filters}
          setFilters={setFilters}
          canEdit={access.canEdit}
          canView={access.canView}
        />
      </div>

      <FounderDrawer
        founderId={filters.founderId || null}
        onClose={() => setFilters({ founderId: '' }, { history: 'push' } as never)}
        canEdit={access.canEdit}
      />
    </div>
  );
}
