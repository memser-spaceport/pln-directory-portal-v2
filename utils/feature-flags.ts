export const USE_ACCESS_CONTROL_V2 = process.env.NEXT_PUBLIC_USE_ACCESS_CONTROL_V2 === 'true';

/**
 * Gantry impact rating rollout switch: 'on' → impact UI against the real API (contract is
 * deployed); unset/'off' → no impact UI, legacy flows untouched (kill switch).
 * Read as a literal property access so Next.js inlines it at build time.
 */
export const GANTRY_IMPACT_UI_ENABLED = process.env.NEXT_PUBLIC_GANTRY_IMPACT === 'on';
