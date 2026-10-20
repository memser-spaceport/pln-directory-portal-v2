import { ReactNode } from 'react';
import { PAGE_ROUTES } from '@/utils/constants';
import { listingPageMetadata } from '@/utils/seo';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { TeamsFilterUrlSync } from '@/components/page/teams/TeamsFilterUrlSync';

export default function Layout({ filters, content }: { filters: ReactNode; content: ReactNode }) {
  /* The URL sync withholds its children until it has read the URL into the filter store, so it wraps the filter rail
     only (LAB-2922, as LAB-2888 did for members and jobs). Wrapping the whole page kept the list out of the server HTML.
     The list renders the server's first page until the store is filled, and the rail's aside is always mounted, so the
     sync still runs on mobile. */
  return <DashboardPagesLayout filters={<TeamsFilterUrlSync>{filters}</TeamsFilterUrlSync>} content={content} />;
}

export const metadata = listingPageMetadata({
  title: 'Teams | Protocol Labs Directory',
  description: 'Browse Protocol Labs network teams — their focus areas, capabilities, and the people on them.',
  path: PAGE_ROUTES.TEAMS,
});
