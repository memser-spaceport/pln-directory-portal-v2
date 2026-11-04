/* Home, version B. Rails and the signed-out story reuse home-v2's mocks. */

export { LATEST_DEALS, PROD_TAGS_BY_UID, SUGGESTED_TEAMS, TOTAL_DEALS } from '../home-v2/mocks';

/* ---------- Review states (?state=) ---------- */

export type HomeBState = 'signed-out' | 'signed-in';

export const HOME_B_STATES: { value: HomeBState; label: string; note: string }[] = [
  {
    value: 'signed-out',
    label: 'Signed out',
    note: "home-v2's signed-out story in the refreshed style: who PL is, the figures, focus areas, this week beside open roles, the map, entities, the investor wall.",
  },
  {
    value: 'signed-in',
    label: 'Signed in',
    note: 'A member, refreshed: Network Updates (forum three at a time, news with Top stories), open-source picks; Popular this week, roles, teams and deals in the rail.',
  },
];

export const isHomeBState = (v: string | null): v is HomeBState => HOME_B_STATES.some((s) => s.value === v);
