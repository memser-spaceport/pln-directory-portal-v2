import { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import { DEMO_DAY_SOCIAL_IMAGE_URL } from '@/utils/constants';

export const metadata: Metadata = {
  title: 'Protocol Labs Demo Day',
  description:
    'An invite-only event for accredited investors, featuring 20+ top teams from Pre-Seed to Series A, across the Protocol Labs network.',
  openGraph: {
    type: 'website',
    images: [
      {
        url: DEMO_DAY_SOCIAL_IMAGE_URL,
        width: 1162,
        height: 1182,
        alt: 'Demo Day',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [DEMO_DAY_SOCIAL_IMAGE_URL],
  },
};

export default (props: PropsWithChildren) => {
  const { children } = props;

  return children;
};
