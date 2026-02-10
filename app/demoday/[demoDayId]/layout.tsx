import { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import { getDemoDaySocialImageUrl } from '@/utils/constants';

export async function generateMetadata({
  params,
}: {
  params: { demoDayId: string };
}): Promise<Metadata> {
  const imageUrl = getDemoDaySocialImageUrl(params.demoDayId);

  return {
    title: 'Protocol Labs Demo Day',
    description:
      'PL Demo Days are virtual events featuring top, pre-selected teams from the PL network. Accredited investors review pitches asynchronously, with 1-click options to connect and invest.',
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
