import { NextRequest, NextResponse } from 'next/server';
import { getTeamList } from '@/app/actions/teams.actions';
import { INITIAL_ITEMS_PER_PAGE } from '@/utils/constants';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.toString();

    // Get auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value || '';

    // Fetch teams list
    const result = await getTeamList(query, 1, INITIAL_ITEMS_PER_PAGE, authToken);

    if (result?.isError) {
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      teams: result.data || [],
      totalItems: result.totalItems || 0,
    });
  } catch (error) {
    console.error('Error fetching teams list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
