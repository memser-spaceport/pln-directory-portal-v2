import { ReactNode } from 'react';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';

export const metadata: Metadata = {
  title: 'PL Infra OS / Factorio | Protocol Labs Directory',
  description: 'How PL Infra runs — goals, numbers, work, and weekly updates',
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

export default function PlInfraOsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
