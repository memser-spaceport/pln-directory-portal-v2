/**
 * SPV Spotlight ships dark. The page 404s unless this is 'true'. Inlined at
 * build time: a change needs a redeploy, not just a restart.
 */
export const SHOW_SPV_SPOTLIGHT: boolean = process.env.NEXT_PUBLIC_SHOW_SPV_SPOTLIGHT === 'true';

/**
 * Serve the page from fixtures instead of the API, until LAB-2670 lands. While
 * on, `?mockStatus=` and `?mockViewer=` pick the state (see spv-spotlight.mock.ts).
 */
export const SPV_MOCK_ENABLED: boolean = process.env.NEXT_PUBLIC_SPV_MOCK === 'true';

export enum SpvSpotlightQueryKeys {
  GET_SPOTLIGHT = 'spv-spotlight',
}

export const SPV_SPOTLIGHT_BASE_PATH = '/spv-spotlight';

export function getSpvSpotlightPath(slug: string) {
  return `${SPV_SPOTLIGHT_BASE_PATH}/${slug}`;
}
