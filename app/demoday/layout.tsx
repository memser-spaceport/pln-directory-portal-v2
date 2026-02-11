import { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import { getDemoDayMetadata } from '@/utils/constants';

const { title, description, imageUrl } = getDemoDayMetadata();

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    images: [
      {
        url: imageUrl,
        alt: 'Demo Day',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: imageUrl,
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
