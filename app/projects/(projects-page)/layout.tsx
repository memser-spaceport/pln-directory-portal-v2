import { ReactNode } from 'react';
import { PAGE_ROUTES } from '@/utils/constants';
import { listingPageMetadata } from '@/utils/seo';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';

export const dynamic = 'force-dynamic';

export default function Layout({ filters, content }: { filters: ReactNode; content: ReactNode }) {
  return <DashboardPagesLayout filters={filters} content={content} />;
}

export const metadata = listingPageMetadata({
  title: 'Projects | Protocol Labs Directory',
  // Its own description (LAB-2923): it shared the directory's generic one with the sign-up pages.
  description:
    'Browse projects across the Protocol Labs network: what each one builds, the team that maintains it and the teams contributing to it.',
  path: PAGE_ROUTES.PROJECTS,
});
