import { ReactNode } from 'react';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';

export const metadata: Metadata = {
  title: 'Founder DB | Protocol Labs Directory',
  description: 'Internal founder signal-sourcing database.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Founder DB | Protocol Labs Directory',
    images: [{ url: `${process.env.APPLICATION_BASE_URL}${SOCIAL_IMAGE_URL}` }],
  },
  twitter: { card: 'summary_large_image', images: [SOCIAL_IMAGE_URL] },
};

export default function Layout({ filters, content }: { filters: ReactNode; content: ReactNode }) {
  return <DashboardPagesLayout filters={filters} content={content} />;
}
