'use client';

import clsx from 'clsx';

import { Badge } from '@/components/common/Badge';
import { CloseIcon } from '@/components/icons';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';

import { ReviewCheckIcon } from './icons';
import { CRITERION_GROUPS, type RoleCriterion, type RoleSuggested, type SuggestionMatch } from './mocks';
import s from './SuggestedMatch.module.scss';

interface Props {
  person: RoleSuggested;
  criteria: RoleCriterion[];
  /** Criteria the lead has switched off — they are not part of the match, so they are not listed. */
  off: ReadonlySet<string>;
  match: SuggestionMatch;
}

/**
 * The suggested tab's pane section, in the place the other tabs have
 * Application or Interest.
 *
 * **The percentage sits over its working.** The header carries the number and
 * "4 of 5 requirements"; the body lists every requirement with a check beside
 * the ones the profile meets and a faded ✕ beside the ones it does not, so the
 * number can be checked against the line under it. Workable draws its match
 * card the same way (a score ring, then Education / Experience / Skills with
 * ✓ and a faded ✗ per criterion), with the group name in a left column.
 *
 * **The network block leads and is not in the count.** "In the network" is what
 * only this product knows — an interest press, a project they worked on, people
 * they have worked with — and there is no honest weight for it in a percentage.
 * It heads the section because it is the reason a 60% can be worth opening
 * before a 100%, and it has no check or ✕ because it is a fact, not a
 * requirement. Absent when the member has none.
 *
 * **Only requirements that are switched on.** The lead can turn criteria off in
 * Edit criteria; a switched-off one is not part of the number, so listing it
 * with a mark would show a working that does not add up.
 */
export function SuggestedWhy({ person, criteria, off, match }: Props) {
  return (
    <DetailsSection>
      <DetailsSectionHeader title="Why suggested">
        <span className={s.headerRight}>
          <span className={s.count}>
            {match.met} of {match.total} requirements
          </span>
          <Badge className={s.percent}>{match.percent}% match</Badge>
        </span>
      </DetailsSectionHeader>
      <DetailsSectionGreyContentContainer>
        <div className={s.groups}>
          {person.reasons.length > 0 && (
            <div className={s.group}>
              <p className={s.groupLabel}>In the network</p>
              <ul className={s.list}>
                {person.reasons.map((r) => (
                  <li key={r.kind + r.text} className={s.item}>
                    <span className={s.mark} aria-hidden="true">
                      <span className={s.dot} />
                    </span>
                    {r.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {CRITERION_GROUPS.map((group) => {
            const items = criteria.filter((c) => c.group === group && !off.has(c.id));
            if (!items.length) return null;
            return (
              <div key={group} className={s.group}>
                <p className={s.groupLabel}>{group}</p>
                <ul className={s.list}>
                  {items.map((c) => {
                    const met = person.met.includes(c.id);
                    return (
                      <li key={c.id} className={clsx(s.item, { [s.unmet]: !met })}>
                        <span className={s.mark} aria-hidden="true">
                          {met ? <ReviewCheckIcon size={16} state="bare" /> : <CloseIcon width={12} height={12} />}
                        </span>
                        {c.label}
                        <span className={s.srOnly}>{met ? ' — met' : ' — not met'}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </DetailsSectionGreyContentContainer>
    </DetailsSection>
  );
}
