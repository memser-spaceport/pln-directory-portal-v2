import { ReactNode } from 'react';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { AiAppsAccessGuard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsAccessGuard';

export const metadata: Metadata = {
  title: 'AI Apps | Protocol Labs Directory',
  description: 'Build your app, share with PL Infra teams.',
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

export default function AiAppsLayout({ children }: { children: ReactNode }) {
  return <AiAppsAccessGuard>{children}</AiAppsAccessGuard>;
}
