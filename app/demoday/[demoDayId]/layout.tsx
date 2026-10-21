import { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import { getDemoDayMetadata } from '@/utils/constants';

export async function generateMetadata(props: { params: Promise<{ demoDayId: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { title, description, imageUrl } = getDemoDayMetadata(params.demoDayId);

  return {
    title,
    description,
    /* Most pages under a Demo Day are dashboards for its admins, founders and investors (active, archive, investor,
       founder, founders-dashboard, prep, showcase, analytics reports), and signed-out visitors are sent away from them.
       None is a search result, so they are not indexed (LAB-2924). The two public pages, the event's landing page and
       its completed view, opt back in with their own canonical address. */
    robots: { index: false, follow: true },
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
