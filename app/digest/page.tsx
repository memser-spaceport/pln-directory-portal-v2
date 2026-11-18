import type { Metadata } from 'next';

import { DigestErrorState } from '@/components/page/digest/DigestErrorState';
import { DigestPage } from '@/components/page/digest/DigestPage';
import { getDigestPage } from '@/services/digest/digest.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your digest | Protocol Labs Directory',
  robots: { index: false, follow: false },
  // The address carries the member's link token: never send it on as a Referer.
  referrer: 'no-referrer',
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * `/digest?t=<link token>` (LAB-3264): one member's digest, from the email, without sign-in. `&issue=<send time>`
 * opens one of that member's past issues (LAB-3294). The read changes nothing; a More / Less choice in the link is
 * saved by the client after load.
 */
export default async function DigestRoute({ searchParams }: Props) {
  const { t, issue: rawIssue } = await searchParams;
  const token = typeof t === 'string' ? t : undefined;
  const issue = typeof rawIssue === 'string' && rawIssue ? rawIssue : undefined;
  const [result, { isLoggedIn }] = await Promise.all([getDigestPage(token, issue), getCookiesFromHeaders()]);

  if (result.error || !token) return <DigestErrorState error={result.error ?? 'invalid'} />;
  return (
    <DigestPage key={issue ?? ''} token={token} issue={issue} data={result.data} isLoggedIn={Boolean(isLoggedIn)} />
  );
}
