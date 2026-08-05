'use client';

/**
 * Role colour-coding for the hop chips — the axis this workspace has so far
 * refused to colour.
 *
 * `PathRole.tsx` says it out loud: *"No colour system here on purpose. Proximity
 * already colour-codes by caliber, and a second palette competing with the
 * load-bearing one is how the column got noisy in the first place."* That is
 * still the position of the shipped tab. This is the experiment that tests it,
 * kept behind a context so the default (`off`) leaves `warm-intros-v2` rendering
 * byte-for-byte what it renders today, and only the new
 * `warm-intros-role-colors` entry ever turns it on.
 *
 * A context rather than a prop: the chips are five components deep (workspace →
 * table → `PathChain` → `PathHop` → `PathProfileChip`) and the drawer reaches
 * them by a second route (`InvestorDrawerMock` → `PathHopRow` → `PathHop`).
 * `PathHop` is the one node both routes pass through, so the mode is read there
 * and nothing in between has to carry it.
 */

import { createContext, useContext } from 'react';

/**
 * `off`  — every chip neutral, the way the workspace reads today.
 * `tag`  — only the role tag under the chip takes the hue. The nodes stay one
 *          uniform object, so the chain still reads as a chain and the colour
 *          lands on the words that name the thing being coloured.
 * `fill` — the chip takes the tint too. Loudest, most scannable.
 *
 * `tag` replaced a `border` mode that tinted the chip's 1px edge *and* the tag.
 * It was neither thing: a 1px edge on a 12px chip is close to subliminal, so the
 * tag was doing the work anyway, and the faint edge just made the chips look
 * slightly inconsistent with each other rather than deliberately coded.
 */
export type RoleColorMode = 'off' | 'tag' | 'fill';

const RoleColorContext = createContext<RoleColorMode>('off');

export const RoleColorProvider = RoleColorContext.Provider;

export function useRoleColorMode(): RoleColorMode {
  return useContext(RoleColorContext);
}

/**
 * The four roles the payload emits, mapped to the class that carries their hue.
 *
 * ── Which production palette ─────────────────────────────────────────────────
 * There are two, and they disagree. `HopRoleBadge.module.scss` (the role pills
 * beside path hops) says founder = green, co-investor = orange, investor =
 * violet. `MasterProfileModal.module.scss` (the type pills at the top of a
 * profile) says founder = **orange**, co-investor = **cyan**, investor =
 * **green**. Founder and investor have their greens and oranges swapped between
 * the two files. Only PL member agrees — indigo in both.
 *
 * These chips follow **MasterProfileModal**, because that modal is what opens
 * when you click one. A chip that is violet and a profile header that is green,
 * for the same person, one click apart, is the worst of the two options — a
 * colour system you have to re-learn on navigation isn't one.
 *
 * Worth raising with dev either way: two palettes for four roles is a bug in the
 * design system, not a thing to route around per surface.
 *
 * `pl_org` is deliberately absent: the Protocol Labs stub is a non-interactive
 * org placeholder, and `roleLabel` already returns null for it.
 */
export const ROLE_TINT_CLASS: Record<string, string> = {
  pl_connector: 'tintPl',
  founder: 'tintFounder',
  co_investor: 'tintCoInvestor',
  investor: 'tintInvestor',
};

/** The legend, in chain order — PL member first, investor last. */
export const ROLE_LEGEND: Array<{ role: string; label: string; note: string }> = [
  { role: 'pl_connector', label: 'PL Member', note: 'starts the path from inside the network' },
  { role: 'founder', label: 'Founder', note: 'a portfolio founder bridging to the investor' },
  { role: 'co_investor', label: 'Co-investor', note: 'someone who has invested alongside them' },
  { role: 'investor', label: 'Investor', note: 'the target — green, as on their profile tag' },
];
