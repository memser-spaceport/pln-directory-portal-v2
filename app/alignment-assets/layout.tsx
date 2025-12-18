import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import PlaaLayoutWrapper from '@/components/page/aligement-assets/plaa-layout-wrapper';

export const metadata: Metadata = {
  title: 'PL Alignment Asset | Protocol Labs Directory',
  description:
    'The PL Alignment Asset is a shared rewards system that ties network-wide contributions to shared progress across the Protocol Labs ecosystem.',
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

export default function PlaaLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <PlaaLayoutWrapper>
      {children}
    </PlaaLayoutWrapper>
  );
}
