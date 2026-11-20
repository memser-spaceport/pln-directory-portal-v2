import { customFetch } from '@/utils/fetch-wrapper';

import type {
  DigestChoice,
  DigestChoiceResponse,
  DigestEmailSettings,
  DigestEmailSettingsChange,
  DigestEmailSettingsResult,
  DigestPageData,
  DigestPageError,
  DigestPageResult,
} from './digest.types';

const apiUrl = (path: string) => `${process.env.DIRECTORY_API_URL}/v1/labos-digest/${path}`;

/**
 * Swaps a digest email link for the id of its issue (LAB-3351). With `issue` (a send time from an older Past issues
 * link) it is that past issue of the link's member. Called from the server page: no auth header, no cache. Saves
 * nothing, so a link scanner that fetches the page is safe.
 */
export async function exchangeDigestLink(
  token: string,
  issue?: string,
): Promise<{ issueUid: string; error?: never } | { issueUid?: never; error: DigestPageError }> {
  try {
    const response = await fetch(apiUrl('exchange'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue ? { token, issue } : { token }),
      cache: 'no-store',
    });
    if (response.ok) {
      const body = await response.json().catch(() => null);
      return typeof body?.issueUid === 'string' && body.issueUid
        ? { issueUid: body.issueUid }
        : { error: 'unavailable' };
    }
    return { error: await linkReadError(response) };
  } catch {
    return { error: 'unavailable' };
  }
}

/**
 * Reads one digest issue by id (LAB-3351), for anyone. With the reader's session (`authToken`, from the server page's
 * cookies) it carries their own name, choices, follows, topics and Past issues; without, none of that. No cache: the
 * answer depends on who reads it.
 */
export async function getDigestIssuePage(issueUid: string, authToken?: string): Promise<DigestPageResult> {
  try {
    const response = await fetch(apiUrl('issue-page'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ issueUid }),
      cache: 'no-store',
    });
    if (response.ok) return { data: withPageDefaults(await response.json()) };
    if (response.status === 400 || response.status === 404) return { error: 'invalid' };
    return { error: 'unavailable' };
  } catch {
    return { error: 'unavailable' };
  }
}

/**
 * Saves More or Less on one story of the issue for the signed-in member, or undoes it (`none`) (LAB-3351). Sent with
 * the member's session through `customFetch` (token refresh, retry on 401). Throws when the save fails.
 */
export async function saveDigestIssueChoice(
  issueUid: string,
  newsItemUid: string,
  choice: DigestChoice | 'none',
): Promise<DigestChoiceResponse> {
  const response = await customFetch(
    apiUrl('issue-choices'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueUid, newsItemUid, choice }),
    },
    true,
  );
  if (!response?.ok) throw new Error(`Digest choice failed (${response?.status ?? 'no response'})`);
  return response.json();
}

/**
 * Fills the page v2 fields (LAB-3288) when the backend doesn't send them yet, so a frontend deployed first still
 * renders: the main source alone, no logo, not followed, no comments, no team card, no next date.
 */
export function withPageDefaults(raw: DigestPageData): DigestPageData {
  return {
    ...raw,
    isTeamMember: raw.isTeamMember ?? false,
    nextSendAt: raw.nextSendAt ?? null,
    topics: { followed: raw.topics?.followed ?? [], suggested: raw.topics?.suggested ?? [] },
    issues: raw.issues ?? [],
    networkNews: raw.networkNews ?? [],
    events: { items: raw.events?.items ?? [], total: raw.events?.total ?? 0 },
    stories: (raw.stories ?? []).map((story) => ({
      ...story,
      teamLogoUrl: story.teamLogoUrl ?? null,
      followsTeam: story.followsTeam ?? false,
      sources: story.sources?.length ? story.sources : [{ url: story.sourceUrl, domain: story.sourceDomain }],
      commentCount: story.commentCount ?? 0,
    })),
  };
}

/** A failed read of a digest link: `expired` gets its own message; anything else the link can't fix is `invalid`. */
async function linkReadError(response: Response): Promise<DigestPageError> {
  if (response.status === 401) {
    const body = await response.json().catch(() => null);
    return body?.reason === 'expired' ? 'expired' : 'invalid';
  }
  if (response.status === 400 || response.status === 404) return 'invalid';
  return 'unavailable';
}

/**
 * Reads the link member's digest email, on or off and daily or weekly (LAB-3312). Called from the server page, like
 * `exchangeDigestLink`: no auth header, no cache, and the read changes nothing, so a link scanner is safe.
 */
export async function getDigestEmailSettings(token: string | undefined): Promise<DigestEmailSettingsResult> {
  if (!token) return { error: 'invalid' };
  try {
    const response = await fetch(apiUrl('email-settings/read'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    if (response.ok) return { data: await response.json() };
    return { error: await linkReadError(response) };
  } catch {
    return { error: 'unavailable' };
  }
}

/** Turns the digest on or off, or switches it, from the browser after a press. Throws when the save fails. */
export async function saveDigestEmailSettings(
  token: string,
  change: DigestEmailSettingsChange,
): Promise<DigestEmailSettings> {
  const response = await fetch(apiUrl('email-settings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, ...change }),
  });
  if (!response.ok) throw new Error(`Digest email settings save failed (${response.status})`);
  return response.json();
}
