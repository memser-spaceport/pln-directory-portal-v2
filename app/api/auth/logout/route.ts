import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookies } from '@/utils/sessionCookies';
import { isSameOriginRequest } from '@/utils/sessionResponse';

/** Ends the session in the browser, including the httpOnly refresh token that page scripts can't remove. */
export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);
  return response;
}
