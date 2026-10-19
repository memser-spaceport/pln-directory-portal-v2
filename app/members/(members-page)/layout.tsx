import { ReactNode } from 'react';
import { PAGE_ROUTES } from '@/utils/constants';
import { listingPageMetadata } from '@/utils/seo';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { MembersFilterUrlSync } from '@/components/page/members/MembersFilterUrlSync';

export default function Layout({ filters, content }: { filters: ReactNode; content: ReactNode }) {
  /* The URL sync withholds its children until it has read the URL into the filter store, so it wraps the filter
     rail only (LAB-2888). Wrapping the whole page kept the list out of the server HTML. The list is read from
     the URL directly, and the rail's aside is always mounted, so the sync still runs on mobile. */
  return <DashboardPagesLayout filters={<MembersFilterUrlSync>{filters}</MembersFilterUrlSync>} content={content} />;
}

export const metadata = listingPageMetadata({
  title: 'Members | Protocol Labs Directory',
  description: 'Find people in the Protocol Labs network by role, skills, and experience.',
  path: PAGE_ROUTES.MEMBERS,
});
