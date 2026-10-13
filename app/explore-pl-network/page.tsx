import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExplorePlNetworkView } from '@/components/page/explore-pl-network/ExplorePlNetworkView';
import { mergePortfolio } from '@/components/page/explore-pl-network/data/mergePortfolio';
import { PORTFOLIO_FALLBACK } from '@/components/page/explore-pl-network/data/portfolio';
import { SHOW_EXPLORE_PL_NETWORK } from '@/services/explore-pl-network/constants';
import { getPortfolioTeams } from '@/services/explore-pl-network/portfolio.service';

export const metadata: Metadata = {
  title: 'Explore the PL Network | Protocol Labs',
  description:
    'Protocol Labs is an innovation network of over 760 organizations. Explore its focus areas, entities and portfolio teams.',
};

export default async function ExplorePlNetworkPage() {
  if (!SHOW_EXPLORE_PL_NETWORK) notFound();
  const teams = mergePortfolio(PORTFOLIO_FALLBACK, await getPortfolioTeams());
  return <ExplorePlNetworkView teams={teams} />;
}
