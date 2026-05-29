import { Metadata } from 'next';
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { GantryAccessGuard } from '@/components/page/gantry/GantryAccessGuard';
import s from '@/components/page/gantry/GantryShell.module.scss';

export const metadata: Metadata = {
  title: 'Gantry | Protocol Labs Directory',
  description: 'Internal ideas and roadmap board for the PL Infra team.',
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

export default function GantryLayout({ children }: { children: ReactNode }) {
  // TEMP: Gantry temporarily hidden. To restore, delete this redirect.
  redirect('/');

  return (
    <GantryAccessGuard>
      <div className={s.root}>
        <div className={s.body}>{children}</div>
      </div>
    </GantryAccessGuard>
  );
}
