import { NextRequest, NextResponse } from 'next/server';
import { fetchForumActivity } from '@/utils/forum-server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const searchParams = request.nextUrl.searchParams;
  const after = searchParams.get('after') || '0';

  const { data: response, error } = await fetchForumActivity(
    `${process.env.FORUM_API_URL}/api/v3/users/${uid}/posts?after=${after}`,
  );

  if (error) {
    return NextResponse.json({ posts: [], nextStart: null, error }, { status: 200 });
  }

  const data = await response.json();
  return NextResponse.json(data.response);
}
