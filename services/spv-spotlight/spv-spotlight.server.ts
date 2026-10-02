import type { SpvSpotlight } from './types';

/**
 * Anonymous server read, for metadata and the first paint. Viewer access is
 * always NONE here; the client refetches with the viewer's token. Never send a
 * token from here: this read is shared across viewers by `revalidate`.
 */
export async function getSpvSpotlightServer(slug: string): Promise<SpvSpotlight | null> {
  if (!slug) return null;

  const apiBase = process.env.DIRECTORY_API_URL;
  if (!apiBase) return null;

  try {
    const response = await fetch(`${apiBase}/v1/spv-spotlights/${encodeURIComponent(slug)}`, {
      method: 'GET',
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return (await response.json()) as SpvSpotlight;
  } catch {
    return null;
  }
}
