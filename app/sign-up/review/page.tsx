import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { Metadata } from 'next';
import SignUpSuccess from '@/components/page/sign-up/sign-up-success';

import s from './page.module.scss';

export default async function Page() {
  return (
    <div className={s.root}>
      <SignUpSuccess />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Sign up | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
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
