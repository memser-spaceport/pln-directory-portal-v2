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
 * `getDigestPage`: no auth header, no cache, and the read changes nothing, so a link scanner is safe.
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
