import type { DigestChoice, DigestChoiceResponse, DigestPageResult } from './digest.types';

const apiUrl = (path: string) => `${process.env.DIRECTORY_API_URL}/v1/labos-digest/${path}`;

/**
 * Reads one member's digest from its email link (LAB-3264). Called from the server page: no auth header,
 * no cache. Reading changes nothing on the backend, so a link scanner that fetches the page is safe.
 */
export async function getDigestPage(token: string | undefined): Promise<DigestPageResult> {
  if (!token) return { error: 'invalid' };
  try {
    const response = await fetch(apiUrl('page'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    if (response.ok) return { data: await response.json() };
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

/** Saves More or Less on one story, or undoes it (`none`). Throws when the save fails. */
export async function saveDigestChoice(
  token: string,
  newsItemUid: string,
  choice: DigestChoice | 'none',
): Promise<DigestChoiceResponse> {
  const response = await fetch(apiUrl('choices'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newsItemUid, choice }),
  });
  if (!response.ok) throw new Error(`Digest choice failed (${response.status})`);
  return response.json();
}
