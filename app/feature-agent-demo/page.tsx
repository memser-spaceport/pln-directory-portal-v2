import React from 'react';
import { Metadata } from 'next';

import { SOCIAL_IMAGE_URL } from '@/utils/constants';

import s from './page.module.scss';

export default function FeatureAgentDemo() {
  return (
    <div className={s.root}>
      <h1 className={s.title}>Hello from autonomous coding agent</h1>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Feature Agent Demo | Protocol Labs Directory',
  description: 'Hello from autonomous coding agent',
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
