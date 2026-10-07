/**
 * SPV Spotlight ships dark. The page 404s unless this is 'true'. Inlined at
 * build time: a change needs a redeploy, not just a restart.
 */
export const SHOW_SPV_SPOTLIGHT: boolean = process.env.NEXT_PUBLIC_SHOW_SPV_SPOTLIGHT === 'true';

/**
 * The request-access flow from LAB-2675: a Request access card, the request and
 * received modals, the pending stepper and the rejected state. Off since the
 * 2026-10-01 standup: investors arrive by a whitelisted token link instead, so
 * the page is locked to anyone not approved. Kept so it can come back.
 */
export const REQUEST_FLOW_ENABLED: boolean = false;

export enum SpvSpotlightQueryKeys {
  GET_SPOTLIGHT = 'spv-spotlight',
}

export const SPV_SPOTLIGHT_BASE_PATH = '/spv-spotlight';

export function getSpvSpotlightPath(slug: string) {
  return `${SPV_SPOTLIGHT_BASE_PATH}/${slug}`;
}
