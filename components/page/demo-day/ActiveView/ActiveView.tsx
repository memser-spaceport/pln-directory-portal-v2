import React from 'react';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { SyncParamsToUrl } from '@/components/core/SyncParamsToUrl';
import { FiltersHydrator } from '@/components/core/FiltersHydrator/FiltersHydrator';
import { Filters } from './components/Filters';

export const ActiveView = () => {
  return (
    <FiltersHydrator>
      <SyncParamsToUrl />
      <DashboardPagesLayout filters={<Filters />} content={<div>content</div>} />
    </FiltersHydrator>
  );
};
