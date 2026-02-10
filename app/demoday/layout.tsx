import { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import { getDemoDaySocialImageUrl } from '@/utils/constants';

export const metadata: Metadata = {
  title: 'Protocol Labs Demo Day',
  description:
    'PL Demo Days are virtual events featuring top, pre-selected teams from the PL network. Accredited investors review pitches asynchronously, with 1-click options to connect and invest.',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    images: [
      {
        url: getDemoDaySocialImageUrl(),
        alt: 'Demo Day',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: getDemoDaySocialImageUrl(),
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
