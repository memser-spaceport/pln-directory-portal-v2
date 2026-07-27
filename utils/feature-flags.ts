export const USE_ACCESS_CONTROL_V2 = process.env.NEXT_PUBLIC_USE_ACCESS_CONTROL_V2 === 'true';

/**
 * Forum posts interleaved in the /home Team News feed + feed-only comments.
 * Gates every UI surface (posts, comment buttons/threads/composer, modal, deep
 * link) — off means /home is pixel- AND network-identical to before the feature.
 * While the feed API doesn't exist, the feature is only usable against fixtures,
 * so this derives from the mock switch (a literal env comparison so the bundler
 * can fold it). At real-API launch this becomes its own switch — one-line change
 * here, and NEXT_PUBLIC_MOCK_FEED_SOCIAL keeps meaning "serve fixtures" only.
 */
export const FEED_SOCIAL_ENABLED = process.env.NEXT_PUBLIC_MOCK_FEED_SOCIAL === 'true';

/**
 * Per-objective rating rows in the boost popover ("Break it down by goal"). UI + payload
 * plumbing are built; flip to true once the backend accepts `objectiveImpacts` on the pin
 * POST/PATCH and returns per-objective aggregates. Code-level (not env) on purpose — it
 * must ship for everyone at once when the contract lands.
 */
export const GANTRY_IMPACT_PER_OBJECTIVE_ENABLED = false;
