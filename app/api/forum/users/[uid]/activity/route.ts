import { NextRequest, NextResponse } from 'next/server';
import { fetchForumActivity } from '@/utils/forum-server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params;

    const response = await fetchForumActivity(`${process.env.FORUM_API_URL}/api/v3/users/${uid}/activity/count`);

    const data = await response.json();
    return NextResponse.json(data.response);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
