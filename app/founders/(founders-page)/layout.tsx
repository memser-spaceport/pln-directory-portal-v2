import { ReactNode } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { FOUNDER_DB_ENABLED } from '@/services/founders/constants';

export const metadata: Metadata = {
  title: 'Founder DB | Protocol Labs Directory',
  description: 'Internal founder signal-sourcing database.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Founder DB | Protocol Labs Directory',
    // SOCIAL_IMAGE_URL is already absolute; prefixing the base made the share image URL invalid.
    images: [{ url: SOCIAL_IMAGE_URL }],
  },
  twitter: { card: 'summary_large_image', images: [SOCIAL_IMAGE_URL] },
};

export default function Layout({ filters, content }: { filters: ReactNode; content: ReactNode }) {
  if (!FOUNDER_DB_ENABLED) {
    redirect('/members');
  }

  return <DashboardPagesLayout filters={filters} content={content} />;
}
