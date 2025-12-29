import isEmpty from 'lodash/isEmpty';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getMemberListForQuery } from '@/app/actions/members.actions';
import { getParsedValue } from '@/utils/common.utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (isEmpty(search)) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const cookieStore = await cookies();
    const authToken = getParsedValue(cookieStore.get('authToken')?.value);

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
