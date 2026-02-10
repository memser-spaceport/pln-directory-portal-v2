import { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import { getDemoDaySocialImageUrl } from '@/utils/constants';

const baseUrl = process.env.APPLICATION_BASE_URL || 'https://directoryv2.dev.plnetwork.io';

export async function generateMetadata({
  params,
}: {
  params: { demoDayId: string };
}): Promise<Metadata> {
  const imageUrl = getDemoDaySocialImageUrl(params.demoDayId);
  const canonicalUrl = `${baseUrl}/demoday/${params.demoDayId}`;

  return {
    title: 'Protocol Labs Demo Day',
    description:
      'PL Demo Days are virtual events featuring top, pre-selected teams from the PL network. Accredited investors review pitches asynchronously, with 1-click options to connect and invest.',
    robots: { index: true, follow: true },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          alt: 'Demo Day',
          type: 'image/png',
          width: 1200,
          height: 630,
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
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default function DemoDayIdLayout({ children }: PropsWithChildren) {
  return children;
}
