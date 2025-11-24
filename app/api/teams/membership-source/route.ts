import { NextRequest, NextResponse } from 'next/server';
import { getFocusAreas, getMembershipSource } from '@/services/common.service';
import { parseFocusAreasParams } from '@/utils/team.utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paramsObj = Object.fromEntries(searchParams.entries());

    // Fetch focus areas for teams
    const result = await getMembershipSource('Team', parseFocusAreasParams(paramsObj));

    if (result?.error) {
      return NextResponse.json(
        { error: 'Failed to fetch membership source' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: result?.data || [],
    });
  } catch (error) {
    console.error('Error fetching membership source:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
