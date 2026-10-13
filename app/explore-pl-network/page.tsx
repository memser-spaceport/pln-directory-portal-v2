import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExplorePlNetworkView } from '@/components/page/explore-pl-network/ExplorePlNetworkView';
import { SHOW_EXPLORE_PL_NETWORK } from '@/services/explore-pl-network/constants';

export const metadata: Metadata = {
  title: 'Explore the PL Network | Protocol Labs',
  description:
    'Protocol Labs is an innovation network of over 760 organizations. Explore its focus areas, entities and portfolio teams.',
};

export default function ExplorePlNetworkPage() {
  if (!SHOW_EXPLORE_PL_NETWORK) notFound();
  return <ExplorePlNetworkView />;
}
