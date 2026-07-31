import isEmpty from 'lodash/isEmpty';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getMemberListForQuery } from '@/app/actions/members.actions';
import { getParsedValue } from '@/utils/common.utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    // Clamp paging: this route proxies the backend search unauthenticated-input
    // first, so NaN/huge values must never be forwarded upstream.
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.isNaN(rawPage) ? 1 : Math.min(Math.max(rawPage, 1), 100);
    const limit = Number.isNaN(rawLimit) ? 10 : Math.min(Math.max(rawLimit, 1), 25);

    if (isEmpty(search)) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const cookieStore = await cookies();
    const authToken = getParsedValue(cookieStore.get('authToken')?.value);

    // Member search is a signed-in capability everywhere it's surfaced
    // (mention pickers); without a token this is an open enumeration endpoint.
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getMemberListForQuery(`search=${encodeURIComponent(search)}`, page, limit, authToken);

    if (result?.isError) {
      return NextResponse.json({ error: 'Failed to search members' }, { status: 500 });
    }

    return NextResponse.json({
      items: result.items || [],
      total: result.total || 0,
    });
  } catch (error) {
    console.error('Error searching members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
