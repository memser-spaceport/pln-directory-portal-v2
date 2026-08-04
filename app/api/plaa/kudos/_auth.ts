import { NextRequest } from 'next/server';

export function resolveAuthHeader(request: NextRequest): string | null {
  return request.headers.get('authorization');
}
