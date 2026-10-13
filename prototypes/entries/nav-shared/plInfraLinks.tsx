import { PlAtsIcon } from '@/components/core/navbar/components/icons';
import {
  AGENT_SESSIONS_LINK,
  AI_APPS_LINK,
  GANTRY_LINK,
  INVESTOR_DB_LINK,
} from '@/components/core/navbar/constants/navLinks';
import type { ISubItem } from '@/components/core/navbar/type';

/**
 * **Hiring** — the proposal. The only entry in this list that production's
 * `navLinks.tsx` does not already export, so it is defined here rather than
 * imported.
 *
 * Named for the destination, not for the tool behind it: production's nearest
 * neighbour is `PL_ATS_LINK`, titled "PL ATS" with the description "AI-native
 * sourcing and hiring pipeline for PL Infra" — an acronym for the app plus a
 * sentence explaining what the acronym is for. "Hiring" is what the person is
 * going there to do, and it is the word the rest of these prototypes use for
 * this work (the board's owner rows, the candidates pages).
 *
 * The glyph is production's own hiring mark (`PlAtsIcon` — a person beside a
 * list), not the board's briefcase: `JOBS_LINK` already wears that one in the
 * **More** menu of the same bar, and one glyph on two entries of one bar reads
 * as the same destination twice. Nothing new was drawn.
 *
 * The href is the prototypes' job board, because that is where this surface
 * exists today — the owner's listings and the candidates pages hang off it. The
 * other four links keep their production routes, which is the same trade every
 * prototype nav item makes: press it and you leave prototype-land.
 */
export const HIRING_LINK: ISubItem = {
  icon: <PlAtsIcon />,
  href: '/prototypes/job-board',
  title: 'Hiring',
  description: 'Open listings and the people who applied to them',
};

/**
 * Static stand-in for `useGetPlInfraNavItems()`, which resolves this same list
 * one permission at a time. A prototype viewer either has the slot or doesn't.
 *
 * Shared by both bars — `PrototypeNavBar` (desktop) and `PrototypeMobileNav` —
 * so the selector cannot say two different things about what PL Infra holds
 * depending on the width of the window.
 *
 * Hiring sits second, where production puts it: `PL_ATS_LINK` is the entry
 * immediately before `INVESTOR_DB_LINK` there, and this list is the same
 * neighbourhood with the dashboards left out.
 */
export const PL_INFRA_LINKS: ISubItem[] = [
  GANTRY_LINK,
  HIRING_LINK,
  INVESTOR_DB_LINK,
  AI_APPS_LINK,
  AGENT_SESSIONS_LINK,
];
