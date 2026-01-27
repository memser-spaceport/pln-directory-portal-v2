import { NextRequest, NextResponse } from 'next/server';
import { fetchForumActivity } from '@/utils/forum-server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params;
    const searchParams = request.nextUrl.searchParams;
    const after = searchParams.get('after') || '0';

    const response = await fetchForumActivity(`${process.env.FORUM_API_URL}/api/v3/users/${uid}/posts?after=${after}`);

    const data = await response.json();
    return NextResponse.json(data.response);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json({ posts: [], nextStart: null }, { status: 200 });
  }
}
