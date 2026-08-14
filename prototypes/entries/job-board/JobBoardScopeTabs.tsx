'use client';

import { useEffect } from 'react';

import { Tabs } from '@/components/ui/tabs/Tabs';

// The badge wears the role row's own "● New" styling 1:1 — same green, same 12/600,
// same dot — so the count at the top of the list and the marker on the row are
// visibly the same claim at two altitudes.
import rowCss from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';

import { useMockJobsFilterStore } from './mockJobsFilterStore';

export const POSTED_PARAM = 'posted';
export const POSTED_NEW = 'new';

const ALL_TAB = 'All';
const NEW_TAB = 'New';

interface Props {
  /** How many roles in the *current* result set are new — see JobBoardPrototype. */
  newCount: number;
}

/**
 * COPY-SIMPLIFY of production `TeamsScopeTabs` (the teams listing's All / Following
 * strip): the same `Tabs` component, the same `variant="secondary"`, the same
 * scroll-to-top on switch, wired to the mock jobs filter store instead of the team
 * one. A scope tab on a listing page already has a pattern here, so this is that
 * pattern with a different second scope.
 *
 * The scope lives in the filter store rather than in component state, like
 * `followingOnly` does on teams — so it's shareable, and Clear All puts you back on
 * the whole board along with everything else you'd narrowed.
 *
 * The badge is `endAdornment` rather than `count`: the secondary variant hides its
 * count pill (`.count { display: none }`) and renders the number inline as
 * "New (3)", which says how many but not what they are.
 */
export function JobBoardScopeTabs({ newCount }: Props) {
  const { params, setParam } = useMockJobsFilterStore();

  const activeTab = params.get(POSTED_PARAM) === POSTED_NEW ? NEW_TAB : ALL_TAB;

  useEffect(() => {
    // Avoid a jarring near-empty view when switching into a shorter tab mid-scroll.
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  const onTabClick = (tab: string) => {
    if (tab === activeTab) return;
    setParam(POSTED_PARAM, tab === NEW_TAB ? POSTED_NEW : undefined);
  };

  return (
    <Tabs
      variant="secondary"
      activeTab={activeTab}
      onTabClick={onTabClick}
      tabs={[
        { name: ALL_TAB },
        {
          name: NEW_TAB,
          /* No badge at zero. A badge reading "0 new posts" is an empty promise
             wearing the styling of a full one; the tab still opens, and says so
             itself. */
          endAdornment:
            newCount > 0 ? (
              <span className={rowCss.newBadge}>
                ● {newCount} new {newCount === 1 ? 'post' : 'posts'}
              </span>
            ) : undefined,
        },
      ]}
    />
  );
}
