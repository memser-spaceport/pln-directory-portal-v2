import { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import { DEMO_DAY_SOCIAL_IMAGE_URL } from '@/utils/constants';

export const metadata: Metadata = {
  title: 'Protocol Labs Demo Day',
  description:
    'PL Demo Days are virtual events featuring top, pre-selected teams from the PL network. Accredited investors review pitches asynchronously, with 1-click options to connect and invest.',
  openGraph: {
    type: 'website',
    images: [
      {
        url: DEMO_DAY_SOCIAL_IMAGE_URL,
        alt: 'Demo Day',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: DEMO_DAY_SOCIAL_IMAGE_URL,
        alt: 'Demo Day',
        type: 'image/png',
      },
    ],
  },
};

export default (props: PropsWithChildren) => {
  const { children } = props;

  return children;
};
