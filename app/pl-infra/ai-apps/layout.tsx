import { ReactNode } from 'react';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';

export const metadata: Metadata = {
  title: 'AI Apps | Protocol Labs Directory',
  description: 'A sandbox to deploy your AI apps on LabOS infra and explore what PL Infra team members are building',
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

// The dashboard list/detail pages gate themselves with AiAppsAccessGuard. The
// guard is intentionally not applied here so the `/connect` page (which a member
// may reach before signing in, or without ai_apps access) can show its own
// sign-in / no-permission states instead of being redirected away.
export default function AiAppsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
