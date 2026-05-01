import { NextRequest, NextResponse } from 'next/server';
import { getJobsList } from '@/app/actions/jobs.actions';
import { jobsBrowserSearchParamsToApiQuery } from '@/utils/jobs-api-query';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = jobsBrowserSearchParamsToApiQuery(request.nextUrl.searchParams);
  const result = await getJobsList(query);
  if ('isError' in result) {
    return NextResponse.json({ error: 'Failed to fetch jobs list' }, { status: result.status ?? 500 });
  }
  return NextResponse.json(result.data);
}
