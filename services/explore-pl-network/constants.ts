/**
 * The Explore PL Network landing ships dark behind its own flag. Surfaces that
 * link to it (the SPV Spotlight tile) hide while it's off, so nothing links to
 * a 404. Inlined at build time.
 */
export const SHOW_EXPLORE_PL_NETWORK: boolean = process.env.NEXT_PUBLIC_SHOW_EXPLORE_PL_NETWORK === 'true';

export const EXPLORE_PL_NETWORK_PATH = '/explore-pl-network';

/**
 * Organizations in the PL network, as the Explore landing states it (marketing's
 * General Info: "over 760"). One constant so the SPV tile and the landing agree.
 */
export const PL_NETWORK_ORGANIZATIONS_LABEL = '760+';

/** Portfolio teams on the landing's map (marketing's static list, 2026-09-29). */
export const EXPLORE_PORTFOLIO_TEAM_COUNT = 284;
