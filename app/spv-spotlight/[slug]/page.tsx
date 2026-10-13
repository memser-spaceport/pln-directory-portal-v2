import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SpvSpotlightView } from '@/components/page/spv-spotlight/SpvSpotlightView';
import { SHOW_SPV_SPOTLIGHT } from '@/services/spv-spotlight/constants';
import { getSpvSpotlightServer } from '@/services/spv-spotlight/spv-spotlight.server';

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Unlisted: reachable by direct link only, never indexed.
const ROBOTS = { index: false, follow: false } as const;

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  if (!SHOW_SPV_SPOTLIGHT) return { robots: ROBOTS };
  const { slug } = await props.params;
  const spotlight = await getSpvSpotlightServer(slug);
  return {
    title: spotlight ? `${spotlight.title} | PL Spotlight` : 'PL Spotlight',
    robots: ROBOTS,
  };
}

export default async function SpvSpotlightPage(props: PageProps) {
  if (!SHOW_SPV_SPOTLIGHT) notFound();
  const { slug } = await props.params;
  const spotlight = await getSpvSpotlightServer(slug);
  if (!spotlight) notFound();

  return <SpvSpotlightView slug={slug} initialSpotlight={spotlight} />;
}
