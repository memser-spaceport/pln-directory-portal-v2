export const USE_ACCESS_CONTROL_V2 = process.env.NEXT_PUBLIC_USE_ACCESS_CONTROL_V2 === 'true';

/**
 * Per-objective rating rows in the boost popover ("Break it down by goal"). UI + payload
 * plumbing are built; flip to true once the backend accepts `objectiveImpacts` on the pin
 * POST/PATCH and returns per-objective aggregates. Code-level (not env) on purpose — it
 * must ship for everyone at once when the contract lands.
 */
export const GANTRY_IMPACT_PER_OBJECTIVE_ENABLED = false;

/**
 * Decorate AI Apps list/detail responses with fixture `deployment` states while
 * the backend contract is pending (LAB-2101 family). Local dev only: the
 * NODE_ENV literal comes first so production builds fold the whole guard to
 * false regardless of the env var. Consumed ONLY by ai-apps.service.ts mock
 * guards; delete all references at API cutover.
 */
export const AI_APPS_DEPLOYMENT_MOCK =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_AI_APPS_DEPLOYMENT_MOCK === 'true';
