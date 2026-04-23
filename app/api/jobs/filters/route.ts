import { NextRequest, NextResponse } from 'next/server';
import { getJobsFilters } from '@/app/actions/jobs.actions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const result = await getJobsFilters(query);
  if ('isError' in result) {
    return NextResponse.json({ error: 'Failed to fetch jobs filters' }, { status: result.status ?? 500 });
  }
  return NextResponse.json(result.data);
}
