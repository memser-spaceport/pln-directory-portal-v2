import React from 'react';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { SyncParamsToUrl } from '@/components/core/SyncParamsToUrl';
import { FiltersHydrator } from '@/components/core/FiltersHydrator/FiltersHydrator';
import { Filters } from './components/Filters';
import { Content } from './components/Content';

export const ActiveView = () => {
  return (
    <FiltersHydrator>
      <SyncParamsToUrl debounceTime={0} />
      <DashboardPagesLayout filters={<Filters />} content={<Content />} />
    </FiltersHydrator>
  );
};
