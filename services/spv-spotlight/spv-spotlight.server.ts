import { SPV_MOCK_ENABLED } from './constants';
import { getMockSpvSpotlight } from './spv-spotlight.mock';
import type { SpvSpotlight } from './types';

/**
 * Anonymous server read, for metadata and the first paint. Viewer access is
 * always NONE here; the client refetches with the viewer's token.
 */
export async function getSpvSpotlightServer(slug: string): Promise<SpvSpotlight | null> {
  if (!slug) return null;
  if (SPV_MOCK_ENABLED) {
    return getMockSpvSpotlight(slug, false);
  }

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
