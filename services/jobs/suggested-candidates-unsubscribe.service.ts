/**
 * The suggested candidates email's one-click unsubscribe (LAB-2849). The token
 * in the email link is the credential, so this is PUBLIC: it runs on a page a
 * signed-out lead lands on, and must not go through `customFetch` with a token —
 * that path reloads the page when there is no session.
 */
export type SuggestedCandidatesUnsubscribeResult =
  | { ok: true }
  /** `invalid`: the backend refused the token (missing, bad signature, wrong purpose, expired). */
  | { ok: false; reason: 'invalid' | 'failed' };

export async function unsubscribeSuggestedCandidatesEmail(
  token: string,
): Promise<SuggestedCandidatesUnsubscribeResult> {
  try {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/job-match/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      return { ok: true };
    }

    return { ok: false, reason: response.status === 400 ? 'invalid' : 'failed' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
