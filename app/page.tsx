import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';

async function LandingPage() {
  redirect(PAGE_ROUTES.MEMBERS);
}

export default LandingPage;

export const metadata: Metadata = {
  title: 'Home | Protocol Labs Directory',
  description: 'The Protocol Labs Directory drives breakthroughs in computing to push humanity forward.',
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
