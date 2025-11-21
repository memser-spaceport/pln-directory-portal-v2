import { NextRequest, NextResponse } from 'next/server';
import { getTeamListFilters } from '@/services/teams.service';
import { DEFAULT_ASK_TAGS } from '@/utils/constants';
import { cookies } from 'next/headers';
import { getParsedValue } from '@/utils/common.utils';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const authToken = getParsedValue(cookieStore.get('authToken')?.value);

    // Fetch filter data
    const result = await getTeamListFilters({}, authToken);

    if (result?.isError) {
      return NextResponse.json(
        { error: 'Failed to fetch filters' },
        { status: 500 }
      );
    }

    // Process askTags with defaults
    let askTags = result?.data?.askTags || [];
    askTags = [
      ...askTags,
      ...DEFAULT_ASK_TAGS.filter((defaultTag) => !askTags.includes(defaultTag)),
    ];

    return NextResponse.json({
      tags: result?.data?.tags || [],
      fundingStage: result?.data?.fundingStage || [],
      membershipSources: result?.data?.membershipSources || [],
      technology: result?.data?.technology || [],
      askTags,
      tiers: result?.data?.tiers || null,
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
