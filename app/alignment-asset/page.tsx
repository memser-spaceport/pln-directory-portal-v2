import { notFound } from 'next/navigation';
import { getCurrentRoundStats } from '@/services/plaa/rounds.service';
import { getTrustHoldings } from '@/services/plaa/trust-holdings.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import PlaaHomeTokens from '@/components/page/aligement-assets/home/plaa-home-tokens';
import PlaaHome from '@/components/page/aligement-assets/home/plaa-home';
import PlaaHomeFooter from '@/components/page/aligement-assets/home/plaa-home-footer';

/**
 * PLAA home. Round content lives on the Leaderboard (PLAA-95); every round is
 * reachable at /alignment-asset/leaderboard?round=N.
 *
 * One page, two personas. The design serves the same marketing home to
 * prospects and to onboarded members and varies only the hero calls to action
 * and one heading, so the two states cannot drift apart.
 *
 * Trust & holdings is optional: if it fails the page still renders and the
 * blocks that depend on it drop out, rather than falling back to fixed numbers.
 */
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
      {/* The onboarded snapshot bar is rendered by SiteHeader, above the LabOS
          navbar, matching the live site. */}
      <PlaaHome round={round} trust={trust} variant={isLoggedIn ? 'member' : 'prospect'} />
      <PlaaHomeFooter />
    </div>
  );
}
