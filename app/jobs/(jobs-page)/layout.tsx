import { ReactNode } from 'react';
import { PAGE_ROUTES } from '@/utils/constants';
import { listingPageMetadata } from '@/utils/seo';
import { JOBS_BOARD_TITLE } from '@/services/jobs/jobSeoTitles';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { JobsFilterUrlSync } from '@/components/page/jobs/JobsFilterUrlSync';

export default function Layout({ filters, content }: { filters: ReactNode; content: ReactNode }) {
  /* The URL sync withholds its children until it has read the URL into the filter store, so it wraps the filter
     rail only (LAB-2888). Wrapping the whole page kept the list out of the server HTML. The list is read from
     the URL directly, and the rail's aside is always mounted, so the sync still runs on mobile. */
  return <DashboardPagesLayout filters={<JobsFilterUrlSync>{filters}</JobsFilterUrlSync>} content={content} />;
}

export const metadata = listingPageMetadata({
  title: JOBS_BOARD_TITLE,
  description: 'Open roles across the Protocol Labs network. Filter by function, seniority, and focus area.',
  path: PAGE_ROUTES.JOBS,
});
