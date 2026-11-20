import type { Metadata } from 'next';

import { DigestErrorState } from '@/components/page/digest/DigestErrorState';
import { DigestPage } from '@/components/page/digest/DigestPage';
import { exchangeDigestLink, getDigestIssuePage } from '@/services/digest/digest.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your digest | Protocol Labs Directory',
  robots: { index: false, follow: false },
  // An email link's first load still carries the link token: never send it on as a Referer.
  referrer: 'no-referrer',
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// A send time (ISO, from an older Past issues link), not an issue id. `Date.parse` alone would accept `iss-9`.
const isSendTime = (value: string) => /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));

/**
 * `/digest?issue=<issue id>` (LAB-3351): one digest issue, for anyone. Signed in, it carries the reader's own data;
 * signed out, none. An email link, `/digest?t=<link token>` (with `&issue=<send time>` from an older Past issues link),
 * is swapped for its issue id here; the page then rewrites the address to `?issue=`, keeping the `#story-` anchor a
 * redirect would lose. Neither read changes anything; a More / Less choice in the address is saved by the client.
 */
export default async function DigestRoute({ searchParams }: Props) {
  const { t, issue: rawIssue } = await searchParams;
  const token = typeof t === 'string' && t ? t : undefined;
  const issue = typeof rawIssue === 'string' && rawIssue ? rawIssue : undefined;
  const { authToken, isLoggedIn } = await getCookiesFromHeaders();

  let issueUid = issue;
  if (token) {
    const exchanged = await exchangeDigestLink(token, issue && isSendTime(issue) ? issue : undefined);
    if (exchanged.error) return <DigestErrorState error={exchanged.error} />;
    issueUid = exchanged.issueUid;
  }
  if (!issueUid) return <DigestErrorState error="invalid" />;

  const result = await getDigestIssuePage(issueUid, typeof authToken === 'string' && authToken ? authToken : undefined);
  if (result.error) return <DigestErrorState error={result.error} />;
  return <DigestPage key={issueUid} issueUid={issueUid} data={result.data} isLoggedIn={Boolean(isLoggedIn)} />;
}
