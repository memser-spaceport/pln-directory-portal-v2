/**
 * SPV Spotlight ships dark. The page 404s unless this is 'true'. Inlined at
 * build time: a change needs a redeploy, not just a restart.
 */
export const SHOW_SPV_SPOTLIGHT: boolean = process.env.NEXT_PUBLIC_SHOW_SPV_SPOTLIGHT === 'true';

export enum SpvSpotlightQueryKeys {
  GET_SPOTLIGHT = 'spv-spotlight',
}

export const SPV_SPOTLIGHT_BASE_PATH = '/spv-spotlight';

export function getSpvSpotlightPath(slug: string) {
  return `${SPV_SPOTLIGHT_BASE_PATH}/${slug}`;
}
