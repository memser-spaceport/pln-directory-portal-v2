import type { Metadata, ResolvingMetadata } from 'next';
import { Suspense } from 'react';
import { PitchView } from '@/components/page/pitch/PitchView';
import { PitchViewSkeleton } from '@/components/page/pitch/PitchViewSkeleton';
import { getTeamPitchAccessServer } from '@/services/team-pitch/team-pitch-access.server';
import type { TeamPitchAccess } from '@/services/team-pitch/hooks/useGetTeamPitchAccess';
import { getTeamSpotlightPath } from '@/services/team-pitch/constants';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';

type PageProps = {
  params: Promise<{ slug: string }>;
};

function buildSpotlightJsonLd(access: TeamPitchAccess, pageUrl: string) {
  const description =
    access.description?.trim() || access.spotlightStatement?.trim() || `${access.teamName} Spotlight on LabOS`;
  const image = access.headerImageUrl || access.logoUrl || SOCIAL_IMAGE_URL;

  if (access.status === 'OPEN') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: access.title,
      description,
      url: pageUrl,
      image,
      eventStatus: 'https://schema.org/EventScheduled',
      organizer: {
        '@type': 'Organization',
        name: access.teamName,
      },
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: access.title,
    description,
    url: pageUrl,
    image,
    about: {
      '@type': 'Organization',
      name: access.teamName,
    },
  };
}

export async function generateMetadata(props: PageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await props.params;
  const access = await getTeamPitchAccessServer(slug);
  const baseUrl = (process.env.APPLICATION_BASE_URL ?? '').replace(/\/$/, '');
  const pageUrl = `${baseUrl}${getTeamSpotlightPath(slug)}`;
  const previousImages = (await parent).openGraph?.images || [];

  if (!access) {
    return {
      title: 'Spotlight | LabOS',
      description: 'LabOS Spotlight page',
      robots: { index: false, follow: false },
    };
  }

  const description =
    access.description?.trim() || access.spotlightStatement?.trim() || `${access.teamName} Spotlight on LabOS`;
  const image = access.headerImageUrl || access.logoUrl || SOCIAL_IMAGE_URL;
  const shouldIndex = access.status === 'OPEN' || access.status === 'CLOSED';

  return {
    title: `${access.title} | LabOS Spotlight`,
    description,
    alternates: {
      canonical: pageUrl,
      types: {
        'application/json': `${baseUrl}/api/spotlight/${slug}/status`,
      },
    },
    robots: shouldIndex ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: 'website',
      url: pageUrl,
      title: access.title,
      description,
      images: [
        {
          url: image,
          width: 1280,
          height: 640,
          alt: access.title,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: access.title,
      description,
      images: [image],
    },
  };
}

export default async function SpotlightPage(props: PageProps) {
  const { slug } = await props.params;
  const access = await getTeamPitchAccessServer(slug);
  const baseUrl = (process.env.APPLICATION_BASE_URL ?? '').replace(/\/$/, '');
  const pageUrl = `${baseUrl}${getTeamSpotlightPath(slug)}`;

  return (
    <>
      {access && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSpotlightJsonLd(access, pageUrl)) }}
        />
      )}
      <Suspense fallback={<PitchViewSkeleton />}>
        <PitchView initialAccess={access} />
      </Suspense>
    </>
  );
}
