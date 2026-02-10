import { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import { getDemoDaySocialImageUrl } from '@/utils/constants';

const baseUrl = process.env.APPLICATION_BASE_URL || 'https://directoryv2.dev.plnetwork.io';

export const metadata: Metadata = {
  title: 'Protocol Labs Demo Day',
  description:
    'PL Demo Days are virtual events featuring top, pre-selected teams from the PL network. Accredited investors review pitches asynchronously, with 1-click options to connect and invest.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${baseUrl}/demoday`,
  },
  openGraph: {
    type: 'website',
    url: `${baseUrl}/demoday`,
    images: [
      {
        url: getDemoDaySocialImageUrl(),
        alt: 'Demo Day',
        type: 'image/png',
        width: 1200,
        height: 630,
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
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default (props: PropsWithChildren) => {
  const { children } = props;

  return children;
};
