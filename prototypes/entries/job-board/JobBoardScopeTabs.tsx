'use client';

import { useEffect } from 'react';

import { Tabs } from '@/components/ui/tabs/Tabs';

import { useMockJobsFilterStore } from './mockJobsFilterStore';

export const SCOPE_PARAM = 'scope';
export const SCOPE_APPLIED = 'applied';
export const SCOPE_MANAGE = 'manage';

const ALL_TAB = 'All';
const APPLIED_TAB = 'Applied';
const MANAGE_TAB = 'Manage listings';

interface Props {
  /** How many roles the viewer has applied to this session. Drives the count and,
   *  at zero, whether the tab is worth offering at all. */
  appliedCount: number;
  /**
   * How many listings the viewer manages, in every state — or `undefined` for
   * a viewer who manages none, which leaves the tab out entirely.
   *
   * Absent rather than disabled: a member who is not a lead is not "not yet"
   * allowed to manage listings, they are not the person this tab is for, and a
   * greyed tab would be a locked door with their name off it.
   */
  manageCount?: number;
}

/**
 * COPY-SIMPLIFY of production `TeamsScopeTabs` (the teams listing's All /
 * Following strip): the same `Tabs` component, the same `variant="secondary"`,
 * the same `count` on the second tab, the same scroll-to-top on switch, wired to
 * the mock jobs filter store instead of the team one. A scope tab on a listing
 * page already has a pattern here, so this is that pattern with a different
 * second scope.
 *
 * **What the second scope is, and what it isn't.** This file used to hold an
 * All / New pair keyed on a `posted=new` param. It was never rendered — the
 * board shipped without it — and it stays unrendered: "new" is already on every
 * row as the green `● New` badge, so a tab for it would be a second way to say
 * something the list says in place. Applied is the opposite case. Nothing on an
 * unfiltered board tells you which of thirteen roles you have already gone for
 * without reading all thirteen rows, and that is precisely the question someone
 * returning to a job board asks first.
 *
 * **The third scope — Manage listings — is the team Asks pattern.** Production's
 * Asks section shows "Open Asks" to everyone and adds an "Archived Asks" tab for
 * the people who can edit (`AsksSection.tsx`, gated on `canEdit`). Same move
 * here: **All** stays the public board, identical for a lead and for a
 * stranger, and the lead gets one more tab holding their team's listings in
 * every state — the one waiting on the PL team, the ones up, the ones they took
 * down. It answers the two questions the public board cannot: *is my submission
 * up yet?* and *where did the one I took down go?* Putting those rows on All
 * instead would have made a lead's board silently different from the board
 * everyone else sees, which is the one thing a lead most needs to be able to
 * trust.
 *
 * **The scope lives in the filter store**, like `followingOnly` does on teams,
 * so Clear All puts you back on the whole board along with everything else you
 * had narrowed rather than leaving one narrowing behind that nothing undoes.
 *
 * In production that store mirrors the URL, so the scope would also be
 * shareable and survive a reload. It does neither here: `mockJobsFilterStore` is
 * a module-level `URLSearchParams` with no address-bar sync, which is the one
 * thing it simplifies away. Worth knowing before anyone reviews this by pasting
 * a link.
 *
 * **Rendered only when signed in**, which is production's rule too (`TeamList`
 * wraps `TeamsScopeTabs` in `isLoggedIn`). A logged-out visitor cannot have
 * applied to anything, so the tab could only ever open an empty list — an offer
 * with nothing behind it.
 */
export function JobBoardScopeTabs({ appliedCount, manageCount }: Props) {
  const { params, setParam } = useMockJobsFilterStore();

  const scope = params.get(SCOPE_PARAM);
  const activeTab = scope === SCOPE_APPLIED ? APPLIED_TAB : scope === SCOPE_MANAGE ? MANAGE_TAB : ALL_TAB;

  useEffect(() => {
    // Avoid a jarring near-empty view when switching into a shorter tab mid-scroll.
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  const onTabClick = (tab: string) => {
    if (tab === activeTab) return;
    setParam(SCOPE_PARAM, tab === APPLIED_TAB ? SCOPE_APPLIED : tab === MANAGE_TAB ? SCOPE_MANAGE : undefined);
  };

  return (
    <Tabs
      variant="secondary"
      activeTab={activeTab}
      onTabClick={onTabClick}
      tabs={[
        { name: ALL_TAB },
        /* `count` rather than a badge, which is production's own choice for
           Following. At zero the count is left off instead of rendering "(0)":
           the tab still opens and says for itself that there is nothing there,
           and a nought beside a label reads as a defect rather than as a fact.
           The tab itself stays — it is how you find your way back after
           applying, and one that appeared the moment you first applied would
           move the toolbar under the reader at the least welcome time. */
        { name: APPLIED_TAB, count: appliedCount > 0 ? appliedCount : undefined },
        /* Last, and only for a manager. The count is every listing the tab
           holds, whatever its state — the same reading as Applied's — so a
           submission ticks it up the moment it is sent, which is the one
           visible receipt on a board where the new row is not on the tab you
           are standing on. */
        ...(manageCount !== undefined ? [{ name: MANAGE_TAB, count: manageCount > 0 ? manageCount : undefined }] : []),
      ]}
    />
  );
}
