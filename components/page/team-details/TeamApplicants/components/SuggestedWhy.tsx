'use client';

import { useId } from 'react';
import clsx from 'clsx';

import {
  DetailsSection,
  DetailsSectionGreyContentContainer,
  DetailsSectionHeader,
} from '@/components/common/profile/DetailsSection';
import { ReviewCheckIcon } from '@/components/icons';
import type { SuggestedCandidate } from '@/schema/suggested-candidates';

import { criterionLines, groupCriteria } from './criteriaGroups';
import { InterestedBadge } from './InterestedBadge';
import { networkReasons, whyTitle } from './networkReasons';
import { metCount } from './suggestionBand';
import { SuggestionBadge } from './SuggestionBadge';
import s from './SuggestedWhy.module.scss';

/**
 * The Suggested tab's pane section, in the place the other tabs have
 * Application or Interest (LAB-2771).
 *
 * **The band over its working.** The header carries the band and "4 of 5
 * requirements"; the body lists every requirement of the role with a check
 * for the ones the profile meets and a faded dash for the ones it does not.
 * A dash, not a ✕: the matcher reads profiles, so a miss means "not on their
 * profile", not "doesn't have it" — and a ✕ means dismiss everywhere else in
 * the product.
 *
 * A member who said "I'm interested" carries the Interested mark beside the
 * band (LAB-2789).
 *
 * **"Why we suggested Ana", and the network first (LAB-2854, after the
 * prototype).** The title names who. The body opens on "In the network":
 * what only this product knows about the member, outside the count. Today
 * that is their interest press, with the whole of their note under it; the
 * block is absent when there is no reason (see `networkReasons`).
 *
 * **Grouped, with short labels (LAB-2854, after Polina's prototype).** The
 * requirements sit under Skills, Experience, Seniority, Location and Other,
 * the group name in a left column that stacks above its rows on a phone.
 * Each row is its short label over the full statement in grey; a miss adds
 * "Not on their profile". A backend that sends no groups gets the flat list,
 * and a requirement with no label shows its statement alone, as before.
 *
 * Edit criteria is not here: it changes the role, not this person, so it
 * sits in the list column under the role (LAB-2837 feedback).
 */
export function SuggestedWhy({ suggestion }: { suggestion: SuggestedCandidate }) {
  const met = metCount(suggestion.criteria);
  const total = suggestion.criteria.length;
  const reasons = networkReasons(suggestion);
  const headingId = useId();
  const sections = groupCriteria(suggestion.criteria);

  return (
    <DetailsSection>
      <DetailsSectionHeader title={whyTitle(suggestion.name)}>
        <span className={s.headerRight}>
          {total > 0 && (
            <span className={s.count}>
              {met} of {total} requirements
            </span>
          )}
          {suggestion.interested && <InterestedBadge />}
          <SuggestionBadge label={suggestion.label} />
        </span>
      </DetailsSectionHeader>
      <DetailsSectionGreyContentContainer>
        <div className={s.groups}>
          {reasons.length > 0 && (
            <div className={s.group}>
              <p id={`${headingId}-network`} className={s.groupLabel}>
                In the network
              </p>
              <ul className={s.list} aria-labelledby={`${headingId}-network`}>
                {reasons.map((reason) => (
                  <li key={reason.kind} className={s.item}>
                    <span className={s.mark} aria-hidden="true">
                      <span className={s.dot} />
                    </span>
                    <span className={s.itemText}>
                      {reason.text}
                      {reason.note && (
                        <blockquote className={s.note} aria-label="Their note">
                          {reason.note}
                        </blockquote>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {suggestion.blurb && <p className={s.blurb}>{suggestion.blurb}</p>}
          {sections.map(({ group, items }) => (
            <div key={group ?? 'all'} className={clsx(group && s.group)}>
              {group && (
                <p id={`${headingId}-${group}`} className={s.groupLabel}>
                  {group}
                </p>
              )}
              <ul
                className={s.list}
                aria-label={group ? undefined : 'Role requirements'}
                aria-labelledby={group ? `${headingId}-${group}` : undefined}
              >
                {items.map(({ criterion, index }) => {
                  const { primary, statement } = criterionLines(criterion);
                  return (
                    <li key={`${index}-${criterion.text}`} className={clsx(s.item, !criterion.matched && s.unmet)}>
                      <span className={s.mark} aria-hidden="true">
                        {criterion.matched ? <ReviewCheckIcon size={16} state="bare" /> : <span className={s.dash} />}
                      </span>
                      <span className={s.itemText}>
                        {primary}
                        <span className={s.srOnly}>{criterion.matched ? ' — met' : ' — not met'}</span>
                        {statement && <span className={s.statement}>{statement}</span>}
                        {!criterion.matched && <span className={s.evidence}>Not on their profile</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </DetailsSectionGreyContentContainer>
    </DetailsSection>
  );
}
