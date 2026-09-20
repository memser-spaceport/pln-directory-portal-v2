import { ReactNode } from 'react';
import { PAGE_ROUTES } from '@/utils/constants';
import { listingPageMetadata } from '@/utils/seo';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { JobsFilterUrlSync } from '@/components/page/jobs/JobsFilterUrlSync';

export default function Layout({ filters, content }: { filters: ReactNode; content: ReactNode }) {
  return (
    <JobsFilterUrlSync>
      <DashboardPagesLayout filters={filters} content={content} />
    </JobsFilterUrlSync>
  );
}

export const metadata = listingPageMetadata({
  title: 'Jobs | Protocol Labs Directory',
  description: 'Open roles across the Protocol Labs network. Filter by function, seniority, and focus area.',
  path: PAGE_ROUTES.JOBS,
});
