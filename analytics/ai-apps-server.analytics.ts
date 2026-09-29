/** LabOS sign-in for a deployed app finishes in a route handler, before the browser is back on a page that can call posthog-js. */
export async function captureAiAppServerEvent(
  event: string,
  properties: Record<string, unknown>,
  distinctId: string,
): Promise<void> {
  const key = process.env.POSTHOG_KEY;
  const host = process.env.POSTHOG_HOST?.replace(/\/$/, '');
  if (!key || !host) return;
  try {
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, event, distinct_id: distinctId, properties }),
    });
  } catch {
    // A missed event must not change the redirect.
  }
}

export function memberUidFromToken(token: string | undefined): string {
  if (!token) return 'anonymous';
  try {
    const segment = token.split('.')[1];
    if (!segment) return 'anonymous';
    const payload = JSON.parse(Buffer.from(segment, 'base64url').toString()) as { memberUid?: unknown };
    return typeof payload.memberUid === 'string' && payload.memberUid ? payload.memberUid : 'anonymous';
  } catch {
    return 'anonymous';
  }
}
