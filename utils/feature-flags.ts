export const USE_ACCESS_CONTROL_V2 = process.env.NEXT_PUBLIC_USE_ACCESS_CONTROL_V2 === 'true';

/**
 * Gantry impact rating rollout switch: 'on' → impact UI against the real API (contract is
 * deployed); unset/'off' → no impact UI, legacy flows untouched (kill switch).
 * Read as a literal property access so Next.js inlines it at build time.
 */
export const GANTRY_IMPACT_UI_ENABLED = process.env.NEXT_PUBLIC_GANTRY_IMPACT === 'on';

/**
 * Per-objective rating rows in the boost popover ("Break it down by goal"). UI + payload
 * plumbing are built; flip to true once the backend accepts `objectiveImpacts` on the pin
 * POST/PATCH and returns per-objective aggregates. Code-level (not env) on purpose — it
 * must ship for everyone at once when the contract lands.
 */
export const GANTRY_IMPACT_PER_OBJECTIVE_ENABLED = false;
