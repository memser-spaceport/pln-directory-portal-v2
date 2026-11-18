import { NextResponse } from 'next/server';

export function upstreamError(status?: number, retryAfter?: string | null): NextResponse {
  if (status === 401) return NextResponse.json({ error: 'Sign in to continue' }, { status });
  if (status === 403) return NextResponse.json({ error: 'Access denied' }, { status });
  if (status === 404) return NextResponse.json({ error: 'Not found' }, { status });
  if (status === 400 || status === 422)
    return NextResponse.json({ error: 'Check your input and try again' }, { status });
  if (status === 409) return NextResponse.json({ error: 'The action conflicts with the current state' }, { status });
  if (status === 429) {
    const validRetryAfter =
      retryAfter &&
      (/^\d{1,10}$/.test(retryAfter) ||
        (/^[A-Za-z0-9,: ]{1,40}$/.test(retryAfter) && Number.isFinite(Date.parse(retryAfter))));
    return NextResponse.json(
      { error: 'Too many requests' },
      { status, headers: validRetryAfter ? { 'Retry-After': retryAfter } : undefined },
    );
  }
  if (status && status >= 400 && status < 500) {
    return NextResponse.json({ error: 'The request could not be completed' }, { status });
  }
  console.error('[PLAA upstream] request failed', { status: status ?? 'unavailable' });
  return NextResponse.json({ error: 'PLAA service is temporarily unavailable' }, { status: 502 });
}

const kudosMessages = new Set([
  'You cannot give kudos to yourself',
  'Not enough points remaining in your round budget',
  'Kudos not found',
  'Only the original giver may edit this kudos',
  'This kudos has been finalized and can no longer be edited',
  'You are not an eligible member of the Alignment Asset program',
  'Recipient is not an eligible member',
  'Recipient is not active in the Directory',
  'No active round is open for kudos',
  'Could not verify the recipient with the Directory. Please try again.',
  'points must be a multiple of 10',
]);

export function kudosUpstreamError(status: number, data: unknown, retryAfter?: string | null): NextResponse {
  if (status === 429 || (status >= 500 && status !== 503)) return upstreamError(status, retryAfter);
  const message = data && typeof data === 'object' && 'message' in data ? data.message : undefined;
  if (typeof message === 'string' && kudosMessages.has(message)) {
    return NextResponse.json({ message }, { status });
  }
  return upstreamError(status, retryAfter);
}
