/**
 * The new Home (LAB-3070). On: a signed-out visitor's /home is the story page (LAB-3072); signed-in members keep the
 * previous Home until LAB-3125. Build-time (Turbopack inlines it), so tests mock this module, not process.env.
 */
export const SHOW_HOME_V2: boolean = process.env.NEXT_PUBLIC_SHOW_HOME_V2 === 'true';
