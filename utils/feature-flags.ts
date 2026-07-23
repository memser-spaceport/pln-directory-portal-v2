export const USE_ACCESS_CONTROL_V2 = process.env.NEXT_PUBLIC_USE_ACCESS_CONTROL_V2 === 'true';

/**
 * AI Apps "Deployment logs" UI (kebab item + card failure-strip link). The
 * backend logs endpoints are agent-token-only until the owner/admin auth
 * change lands — flip this only after a non-owner 403 has been verified
 * against the target environment, or every open is a 403. UX gate only; the
 * server enforces access regardless. Inlined at build time (flip = redeploy).
 */
export const AI_APPS_LOGS_ENABLED = process.env.NEXT_PUBLIC_AI_APPS_LOGS_ENABLED === 'true';

/**
 * Per-objective rating rows in the boost popover ("Break it down by goal"). UI + payload
 * plumbing are built; flip to true once the backend accepts `objectiveImpacts` on the pin
 * POST/PATCH and returns per-objective aggregates. Code-level (not env) on purpose — it
 * must ship for everyone at once when the contract lands.
 */
export const GANTRY_IMPACT_PER_OBJECTIVE_ENABLED = false;
