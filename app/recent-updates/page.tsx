import React from 'react';
import { Metadata } from 'next';

import { SOCIAL_IMAGE_URL } from '@/utils/constants';

import { getCookiesFromHeaders } from '@/utils/next-helpers';

import { RecentUpdatesSection } from '@/components/page/home/recent-updates';

import s from './RecentUpdatesPage.module.scss';

export default async function RecentUpdates() {
  const { isLoggedIn } = await getCookiesFromHeaders();

  return (
    <div className={s.root}>
      <RecentUpdatesSection isLoggedIn={!!isLoggedIn} />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Recent Updates | Protocol Labs Directory',
  description: 'The Protocol Labs Directory drives breakthroughs in computing to push humanity forward.',
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
