'use client';

import { useQueryStates } from 'nuqs';
import { useFoundersAccess } from '@/services/rbac/hooks/useFoundersAccess';
import { FiltersPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import { foundersFilterParsers } from '../searchParams';
import { FoundersFilterRail } from '@/components/page/founders/FoundersFilterRail/FoundersFilterRail';

export default function FoundersFiltersContent() {
  const access = useFoundersAccess();
  const [filters, setFilters] = useQueryStates(foundersFilterParsers, { history: 'replace', shallow: true });

  if (access.isLoading) return <FiltersPanelSkeletonLoader />;
  if (!access.canView) return null;

  return <FoundersFilterRail filters={filters} setFilters={setFilters} />;
}
