import type { Metadata } from 'next';

import { DigestEmailErrorState } from '@/components/page/digest/email/DigestEmailErrorState';
import { DigestEmailSettings } from '@/components/page/digest/email/DigestEmailSettings';
import { getDigestEmailSettings } from '@/services/digest/digest.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your digest email | Protocol Labs Directory',
  robots: { index: false, follow: false },
  // The address carries the member's link token: never send it on as a Referer.
  referrer: 'no-referrer',
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (value: string | string[] | undefined) => (typeof value === 'string' ? value : null);

/**
 * `/digest/email?t=<link token>&link_type=manage|unsubscribe|switch_frequency&to=daily|weekly` (LAB-3312): the
 * digest email footer's Manage preferences, Switch and Unsubscribe, without sign-in. The read changes nothing.
 */
export default async function DigestEmailRoute({ searchParams }: Props) {
  const params = await searchParams;
  const token = one(params.t) ?? undefined;
  const [result, { isLoggedIn }] = await Promise.all([getDigestEmailSettings(token), getCookiesFromHeaders()]);

  if (result.error || !token) return <DigestEmailErrorState error={result.error ?? 'invalid'} />;
  return (
    <DigestEmailSettings
      token={token}
      initial={result.data}
      linkType={one(params.link_type)}
      to={one(params.to)}
      isLoggedIn={Boolean(isLoggedIn)}
    />
  );
}
