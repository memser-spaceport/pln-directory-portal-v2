'use client';

import { Button } from '@/components/common/Button';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete';

import { hasCriteria, summariseCriteria, type JobPreferences, type RoleCriteria } from './viewerState';
import s from './MatchNudgeStrip.module.scss';

interface MatchNudgeStripProps {
  /** What the rail is currently narrowed to — the intent already expressed. */
  criteria: RoleCriteria;
  /** What's been saved, if anything. */
  preferences: JobPreferences;
  onSetPreferences: () => void;
}

/**
 * The nudge. One strip, three states, and it **self-extinguishes** — once
 * preferences exist there is nothing left to ask for, so nothing is shown. A
 * banner that never goes away is decoration, and it teaches people to stop
 * reading the slot.
 *
 * The post-save confirmation used to be a fourth state here. It's a toast now
 * (see `onSavePreferences`): it reports on something that just happened and then
 * has nothing further to say, and as a strip it appeared in the slot directly
 * above the list, pushing the freshly re-sorted board down at the exact moment
 * the person was meant to look at it. This component is only ever the *ask*.
 *
 * Built on production's `DataIncomplete` (the codebase's one strip primitive that
 * takes arbitrary children — no hooks, no context, tokenised surface). Not
 * `MemberProfileLoginStrip`: its copy is hardcoded to member profiles and it
 * demands a full `IMember`.
 *
 * Signed-in only — the caller guards it. A logged-out visitor gets `SignInBanner`
 * instead (production's home `Welcome`), because two asks stacked on one page is
 * one ask too many, and the first thing to ask a stranger is not their seniority.
 *
 * Deliberately absent: percentages. The count only appears once there's a real
 * preference behind it — "4 roles like yours" for someone we don't know would be
 * invented.
 */
export function MatchNudgeStrip(props: MatchNudgeStripProps) {
  const { criteria, preferences, onSetPreferences } = props;

  const preferencesSet = hasCriteria(preferences);
  const filtersApplied = hasCriteria(criteria);

  if (preferencesSet) return null;

  /* With filters applied the ask writes itself — the person has already said what
     they want, so the strip offers to keep it rather than opening with an empty
     form. */
  return (
    <DataIncomplete className={s.root}>
      <span className={s.text}>
        {filtersApplied ? (
          <>
            Looking for <strong>{summariseCriteria(criteria)}</strong>? Save it and we&apos;ll sort the board around it.
          </>
        ) : (
          <>Tell us what you&apos;re looking for and we&apos;ll sort the board around it.</>
        )}
      </span>
      <Button size="s" onClick={onSetPreferences} className={s.action}>
        {filtersApplied ? 'Save this' : 'Set my preferences'}
      </Button>
    </DataIncomplete>
  );
}
