import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getJobsList } from '@/app/actions/jobs.actions';
import { getParsedValue } from '@/utils/common.utils';
import { jobsBrowserSearchParamsToApiQuery } from '@/utils/jobs-api-query';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = jobsBrowserSearchParamsToApiQuery(request.nextUrl.searchParams);

  /* Forwarded so the board can answer "has this viewer signalled interest in
     this team" (`IJobTeam.viewerIsInterestedInTeam`). Optional throughout: the
     board is public, and without a cookie this request is exactly as anonymous
     as it has always been.

     Read here rather than on the client because `customFetch(..., true)` logs
     the session out and reloads the page when there is no refresh token — on a
     page anyone can open, that is a reload loop for every visitor. The pattern
     is `app/api/members-search/route.ts`'s.

     Nothing caches the result (`force-dynamic` above, `no-store` in the action),
     so one member's flags cannot be served to another. */
  const cookieStore = await cookies();
  const authToken = getParsedValue(cookieStore.get('authToken')?.value);

  const result = await getJobsList(query, authToken || undefined);
  if ('isError' in result) {
    return NextResponse.json({ error: 'Failed to fetch jobs list' }, { status: result.status ?? 500 });
  }
  return NextResponse.json(result.data);
}
