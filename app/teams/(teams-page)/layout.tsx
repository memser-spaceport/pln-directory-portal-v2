import { ReactNode } from 'react';
import { PAGE_ROUTES } from '@/utils/constants';
import { listingPageMetadata } from '@/utils/seo';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { TeamsFilterUrlSync } from '@/components/page/teams/TeamsFilterUrlSync';

export default function Layout({ filters, content }: { filters: ReactNode; content: ReactNode }) {
  return (
    <TeamsFilterUrlSync>
      <DashboardPagesLayout filters={filters} content={content} />
    </TeamsFilterUrlSync>
  );
}

export const metadata = listingPageMetadata({
  title: 'Teams | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
  path: PAGE_ROUTES.TEAMS,
});
