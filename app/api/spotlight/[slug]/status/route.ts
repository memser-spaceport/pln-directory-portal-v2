import { NextResponse } from 'next/server';
import { getTeamPitchAccessServer } from '@/services/team-pitch/team-pitch-access.server';
import { getTeamSpotlightPath } from '@/services/team-pitch/constants';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const access = await getTeamPitchAccessServer(slug);

  if (!access) {
    return NextResponse.json({ error: 'Spotlight not found' }, { status: 404 });
  }

  const baseUrl = (process.env.APPLICATION_BASE_URL ?? '').replace(/\/$/, '');

  return NextResponse.json({
    slug: access.slug,
    status: access.status,
    title: access.title,
    teamName: access.teamName,
    teamUid: access.teamUid,
    loginRequired: true,
    isOpen: access.status === 'OPEN',
    url: `${baseUrl}${getTeamSpotlightPath(access.slug)}`,
  });
}
