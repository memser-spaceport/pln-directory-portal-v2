'use client';

import { ReactNode } from 'react';

import { useJobsFilterStore } from '@/services/jobs/store';

import { FilterStoreUrlSync } from '@/components/common/filters/FilterStoreUrlSync';

export function JobsFilterUrlSync({ children }: { children: ReactNode }) {
  return <FilterStoreUrlSync store={useJobsFilterStore}>{children}</FilterStoreUrlSync>;
}
