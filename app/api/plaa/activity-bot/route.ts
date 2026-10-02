import { sign } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const turnSchema = z
  .object({
    sessionId: z.string().min(1).max(128),
    activityId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
    message: z.string().max(2000).optional(),
    event: z.literal('privacy_acknowledged').optional(),
  })
  .strip();

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

function readAuthToken(request: NextRequest): string {
  const raw = request.cookies.get('authToken')?.value ?? '';

  try {
    return decodeURIComponent(raw).replace(/"/g, '');
  } catch {
    return '';
  }
}

async function resolveMemberUid(authToken: string): Promise<string> {
  const res = await fetch(`${process.env.DIRECTORY_API_URL}/v2/access-control-v2/me/access`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    cache: 'no-store',
  });
  if (!res.ok) return '';

  const data = await res.json().catch(() => null);
  return typeof data?.memberUid === 'string' ? data.memberUid : '';
}

function signMemberToken(signingKey: string, memberUid: string, sessionId: string): string {
  return sign({ sid: sessionId }, signingKey.replace(/\\n/g, '\n'), {
    algorithm: 'ES256',
    subject: memberUid,
    audience: 'plaa-activity-bot',
    expiresIn: 60,
  });
}

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.PLAA_BOT_WEBHOOK_URL;
  const signingKey = process.env.PLAA_BOT_SIGNING_KEY;
  if (!webhookUrl || !signingKey) {
    return NextResponse.json({ error: 'The activity bot is not configured' }, { status: 503 });
  }

  // A JSON content type forces a CORS preflight, so another site cannot post here with the member's cookie.
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const authToken = readAuthToken(request);
  if (!authToken) {
    return NextResponse.json({ error: 'Sign in to submit an activity' }, { status: 401 });
  }

  const turn = turnSchema.safeParse(await request.json().catch(() => null));
  if (!turn.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const memberUid = await resolveMemberUid(authToken);
    if (!memberUid) {
      return NextResponse.json({ error: 'Sign in to submit an activity' }, { status: 401 });
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${signMemberToken(signingKey, memberUid, turn.data.sessionId)}`,
      },
      body: JSON.stringify(turn.data),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('PLAA activity bot proxy error:', error);
    return NextResponse.json({ error: 'The activity bot could not be reached' }, { status: 502 });
  }
}
