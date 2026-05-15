import { buildAllFixtures } from './generateFixtures';

const built = buildAllFixtures();

/** All investors in the enrichment pipeline (the superset). */
export const INVESTOR_FIXTURES = built.investors;

/** PL portfolio teams + their co-investor cap-table edges. */
export const PL_PORTFOLIO_TEAMS_FIXTURES = built.teams;
