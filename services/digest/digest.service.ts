import type { DigestChoice, DigestChoiceResponse, DigestPageData, DigestPageResult } from './digest.types';

const apiUrl = (path: string) => `${process.env.DIRECTORY_API_URL}/v1/labos-digest/${path}`;

/**
 * Reads one member's digest from its email link (LAB-3264), or with `issue` (a send time) one of that member's past
 * issues (LAB-3294). Called from the server page: no auth header, no cache. Reading changes nothing on the backend, so
 * a link scanner that fetches the page is safe.
 */
export async function getDigestPage(token: string | undefined, issue?: string): Promise<DigestPageResult> {
  if (!token) return { error: 'invalid' };
  try {
    const response = await fetch(apiUrl('page'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue ? { token, issue } : { token }),
      cache: 'no-store',
    });
    if (response.ok) return { data: withPageDefaults(await response.json()) };
    if (response.status === 401) {
      const body = await response.json().catch(() => null);
      return { error: body?.reason === 'expired' ? 'expired' : 'invalid' };
    }
    if (response.status === 400 || response.status === 404) return { error: 'invalid' };
    return { error: 'unavailable' };
  } catch {
    return { error: 'unavailable' };
  }
}

/**
 * Saves More or Less on one story, or undoes it (`none`). `issue` names the past issue the story is in (LAB-3294).
 * Throws when the save fails.
 */
export async function saveDigestChoice(
  token: string,
  newsItemUid: string,
  choice: DigestChoice | 'none',
  issue?: string,
): Promise<DigestChoiceResponse> {
  const response = await fetch(apiUrl('choices'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(issue ? { token, newsItemUid, choice, issue } : { token, newsItemUid, choice }),
  });
  if (!response.ok) throw new Error(`Digest choice failed (${response.status})`);
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
    stories: (raw.stories ?? []).map((story) => ({
      ...story,
      teamLogoUrl: story.teamLogoUrl ?? null,
      followsTeam: story.followsTeam ?? false,
      sources: story.sources?.length ? story.sources : [{ url: story.sourceUrl, domain: story.sourceDomain }],
      commentCount: story.commentCount ?? 0,
    })),
  };
}
