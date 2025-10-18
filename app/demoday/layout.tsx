import { PropsWithChildren } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  openGraph: {
    type: 'website',
    images: [
      {
        url: 'https://plabs-assets.s3.us-west-1.amazonaws.com/demoday.jpeg',
        width: 800,
        height: 800,
        alt: 'Demo Day',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/demo-day/demoday.jpeg'],
  },
};

export default (props: PropsWithChildren) => {
  const { children } = props;

  return children;
};
