export const USE_ACCESS_CONTROL_V2 = process.env.NEXT_PUBLIC_USE_ACCESS_CONTROL_V2 === 'true';

/**
 * Gantry impact rating rollout: unset/'off' → no impact UI (legacy flows untouched),
 * 'mock' → impact UI + stateful in-memory mock decorating real API responses (dev only),
 * 'on' → impact UI against the real API.
 * Read as a literal property access so Next.js inlines it at build time; 'mock' is
 * impossible in production builds regardless of the deploy environment.
 */
const gantryImpactMode =
  process.env.NEXT_PUBLIC_GANTRY_IMPACT === 'on'
    ? 'on'
    : process.env.NEXT_PUBLIC_GANTRY_IMPACT === 'mock'
      ? process.env.NODE_ENV === 'production'
        ? 'on'
        : 'mock'
      : 'off';

/**
 * Components branch on this only — cutover to the real API never touches UI code.
 * The mock gate ('mock' mode) is NOT exported from here: gantry.service.ts computes it from
 * literal env reads so the bundler can dead-code-eliminate the mock module entirely.
 */
export const GANTRY_IMPACT_UI_ENABLED = gantryImpactMode !== 'off';
