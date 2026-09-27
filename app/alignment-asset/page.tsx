import { notFound } from 'next/navigation';
import { getCurrentRoundStats } from '@/services/plaa/rounds.service';
import { getTrustHoldings } from '@/services/plaa/trust-holdings.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import PlaaHomeTokens from '@/components/page/aligement-assets/home/plaa-home-tokens';
import PlaaHome from '@/components/page/aligement-assets/home/plaa-home';
import PlaaHomeFooter from '@/components/page/aligement-assets/home/plaa-home-footer';

export default async function PlaaHomePage() {
  const [{ data: round }, { data: trust }, { isLoggedIn }] = await Promise.all([
    getCurrentRoundStats(),
    getTrustHoldings(),
    getCookiesFromHeaders(),
  ]);

  if (!round) notFound();

  return (
    <div className="plaa-home">
      <PlaaHomeTokens />
      <PlaaHome round={round} trust={trust} variant={isLoggedIn ? 'member' : 'prospect'} />
      <PlaaHomeFooter />
    </div>
  );
}
