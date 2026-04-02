import { ReactNode } from 'react';
import { Metadata } from 'next';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';

export default function Layout({ filters, content }: { filters: ReactNode; content: ReactNode }) {
  return <DashboardPagesLayout filters={filters} content={content} />;
}

export const metadata: Metadata = {
  title: 'Advisors | Protocol Labs Directory',
};
