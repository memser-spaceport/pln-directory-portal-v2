'use client';

import { useMyInviteLink } from '@/services/members/hooks/useMyInviteLink';

import { DigestCopyLink } from './DigestCopyLink';

/** `/digest?issue=<issue>&ref=<invite code>` on this site: only these two parameters, no hash and no reader state. */
export function digestShareUrl(origin: string, issueUid: string, inviteCode: string): string {
  return `${origin}/digest?${new URLSearchParams({ issue: issueUid, ref: inviteCode })}`;
}

type Props = { issueUid: string; uid: string | undefined };

/**
 * The digest's Copy link (LAB-3398, contract confirmed by Vova): the reader's own invite code from
 * `GET /v1/members/me/invite-link`. Signed out, it makes no request. The query key holds the member uid.
 */
export function DigestShareLink({ issueUid, uid }: Props) {
  const { data } = useMyInviteLink(uid);
  const code = uid ? data?.inviteCode : undefined;
  if (!code || typeof window === 'undefined') return null;
  const url = digestShareUrl(window.location.origin, issueUid, code);
  return <DigestCopyLink key={url} url={url} />;
}
