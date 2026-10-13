import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SpvSpotlightView } from '@/components/page/spv-spotlight/SpvSpotlightView';
import { REQUEST_FLOW_ENABLED, SHOW_SPV_SPOTLIGHT } from '@/services/spv-spotlight/constants';
import { getSpvSpotlightServer } from '@/services/spv-spotlight/spv-spotlight.server';

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Unlisted: reachable by direct link only, never indexed.
const ROBOTS = { index: false, follow: false } as const;

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  // Gated, this read can't tell an invitee from anyone else, so the tab never
  // names the deal.
  if (!SHOW_SPV_SPOTLIGHT || !REQUEST_FLOW_ENABLED) return { title: 'PL Spotlight', robots: ROBOTS };
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

  // Gated, the anonymous read only proves the slug exists. Its content would
  // land in the page source of viewers who aren't allowed to see it, so the
  // client waits for its own signed-in read instead.
  return <SpvSpotlightView slug={slug} initialSpotlight={REQUEST_FLOW_ENABLED ? spotlight : null} />;
}
