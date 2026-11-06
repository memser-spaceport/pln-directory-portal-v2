import { NextRequest } from 'next/server';

import { proxyForumRequest } from '@/services/forum/forum-nodebb.server';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyForumRequest(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
