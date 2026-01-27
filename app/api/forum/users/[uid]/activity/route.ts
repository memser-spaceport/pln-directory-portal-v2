import { NextRequest, NextResponse } from 'next/server';
import { fetchForumActivity } from '@/utils/forum-server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;

  const { data: response, error } = await fetchForumActivity(
    `${process.env.FORUM_API_URL}/api/v3/users/${uid}/activity/count`,
  );

  if (error) {
    return NextResponse.json({ postsCount: 0, commentsCount: 0, error }, { status: 200 });
  }

  const data = await response.json();
  return NextResponse.json(data.response);
}
