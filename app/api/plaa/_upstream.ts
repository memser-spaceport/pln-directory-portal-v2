import { z } from 'zod';

const segmentsSchema = z.array(z.string().regex(/^[A-Za-z0-9_-]{1,64}$/));

type QueryValue = string | null | undefined;

export function plaaUpstreamUrl(
  baseUrl: string,
  segments: string[],
  query: Record<string, QueryValue> = {},
): string | null {
  if (!segmentsSchema.safeParse(segments).success) {
    return null;
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const queryString = params.toString();

  return `${baseUrl}/api/v1/${segments.join('/')}${queryString ? `?${queryString}` : ''}`;
}
