'use client';

import clsx from 'clsx';

import { Badge } from '@/components/common/Badge';
import {
  DetailsSection,
  DetailsSectionGreyContentContainer,
  DetailsSectionHeader,
} from '@/components/common/profile/DetailsSection';
import { ReviewCheckIcon } from '@/components/icons';
import type { SuggestedCandidate } from '@/schema/suggested-candidates';

import { SUGGESTION_BAND_VARIANT, metCount } from './suggestionBand';
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
 */
export function SuggestedWhy({ suggestion }: { suggestion: SuggestedCandidate }) {
  const met = metCount(suggestion.criteria);
  const total = suggestion.criteria.length;

  return (
    <DetailsSection>
      <DetailsSectionHeader title="Why suggested">
        <span className={s.headerRight}>
          {total > 0 && (
            <span className={s.count}>
              {met} of {total} requirements
            </span>
          )}
          <Badge variant={SUGGESTION_BAND_VARIANT[suggestion.label]} className={s.matchBadge}>
            {suggestion.label}
          </Badge>
        </span>
      </DetailsSectionHeader>
      <DetailsSectionGreyContentContainer>
        {suggestion.blurb && <p className={s.blurb}>{suggestion.blurb}</p>}
        {total > 0 && (
          <ul className={s.list} aria-label="Role requirements">
            {suggestion.criteria.map((criterion, index) => (
              <li key={`${index}-${criterion.text}`} className={clsx(s.item, !criterion.matched && s.unmet)}>
                <span className={s.mark} aria-hidden="true">
                  {criterion.matched ? <ReviewCheckIcon size={16} state="bare" /> : <span className={s.dash} />}
                </span>
                <span className={s.itemText}>
                  {criterion.text}
                  <span className={s.srOnly}>{criterion.matched ? ' — met' : ' — not met'}</span>
                  {!criterion.matched && <span className={s.evidence}>Not on their profile</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DetailsSectionGreyContentContainer>
    </DetailsSection>
  );
}
