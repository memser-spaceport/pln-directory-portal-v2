import { notFound } from 'next/navigation';
import { getPlaaSummary } from '@/services/plaa/summary.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import PlaaHomeTokens from '@/components/page/aligement-assets/home/plaa-home-tokens';
import PlaaHome from '@/components/page/aligement-assets/home/plaa-home';
import PlaaHomeFooter from '@/components/page/aligement-assets/home/plaa-home-footer';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/utils/seo';

/* Its own canonical address (LAB-2924: Search Console found the page with none). Set on the page, not the
   alignment-asset layout, whose metadata also reaches every alignment-asset subpage. */
export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl('/alignment-asset') },
};

export default async function PlaaHomePage() {
  const [{ data: summary }, { isLoggedIn }] = await Promise.all([getPlaaSummary(), getCookiesFromHeaders()]);

  if (!summary) notFound();

  return (
    <div className="plaa-home">
      <PlaaHomeTokens />
      <PlaaHome round={summary.round} trust={summary.trust ?? undefined} variant={isLoggedIn ? 'member' : 'prospect'} />
      <PlaaHomeFooter />
    </div>
  );
}
