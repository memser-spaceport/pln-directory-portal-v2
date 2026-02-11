import { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import { getDemoDayMetadata } from '@/utils/constants';

export async function generateMetadata({
  params,
}: {
  params: { demoDayId: string };
}): Promise<Metadata> {
  const { title, description, imageUrl } = getDemoDayMetadata(params.demoDayId);

  return {
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
}

export default function DemoDayIdLayout({ children }: PropsWithChildren) {
  return children;
}
