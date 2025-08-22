import { ReactNode } from 'react';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { SyncParamsToUrl } from '@/components/core/SyncParamsToUrl';
// import { InitFiltersFromUrl } from '@/components/core/InitFiltersFromUrl';
import { FiltersHydrator } from '@/components/core/FiltersHydrator/FiltersHydrator';

export default function Layout({ filters, content }: { filters: ReactNode; content: ReactNode }) {
  return (
    <FiltersHydrator>
      <SyncParamsToUrl />
      <DashboardPagesLayout filters={filters} content={content} />
    </FiltersHydrator>
  );
}

export const metadata: Metadata = {
  title: 'Members | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
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
