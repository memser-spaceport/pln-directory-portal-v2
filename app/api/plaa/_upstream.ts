const SEGMENT_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

type QueryValue = string | null | undefined;

export function plaaUpstreamUrl(
  baseUrl: string,
  segments: string[],
  query: Record<string, QueryValue> = {},
): string | null {
  if (!segments.every((segment) => SEGMENT_PATTERN.test(segment))) {
    return null;
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const queryString = params.toString();

  return `${baseUrl}/api/v1/${segments.join('/')}${queryString ? `?${queryString}` : ''}`;
}
