import { ReactNode } from 'react';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';

export default function Layout({ filters, content }: { filters: ReactNode; content: ReactNode }) {
  return <DashboardPagesLayout filters={filters} content={content} />;
}

export const metadata: Metadata = {
  title: 'Deals | Protocol Labs Directory',
  description: 'Exclusive software deals for Protocol Labs network founders. Browse deals on developer tools, hosting, analytics, and more.',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Directory',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [SOCIAL_IMAGE_URL],
  },
};
