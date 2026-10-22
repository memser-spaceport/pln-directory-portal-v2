'use client';

import clsx from 'clsx';

import btn from '@/components/common/Button/Button.module.scss';

import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';

import { ReviewCheckIcon } from './icons';
import {
  CRITERION_GROUPS,
  type RoleCriterion,
  type RoleSuggested,
  type SuggestionMatch,
} from './mocks';
import { MatchBadge } from './MatchBadge';
import s from './SuggestedMatch.module.scss';

interface Props {
  person: RoleSuggested;
  criteria: RoleCriterion[];
  /** Criteria the lead has switched off — they are not part of the match, so they are not listed. */
  off: ReadonlySet<string>;
  match: SuggestionMatch;
  /** Opens Edit criteria. Absent → no control (a host with nothing to edit). */
  onEditCriteria?: () => void;
}

/**
 * The suggested tab's pane section, in the place the other tabs have
 * Application or Interest.
 *
 * **The band sits over its working.** The header carries "Strong match" or
 * "Good match" (see `STRONG_MATCH`) and "4 of 5 requirements"; the body lists
 * every requirement with a check beside the ones the profile meets and a
 * faded dash beside the ones it does not, so the claim can be checked against
 * the line under it. Workable draws its match card the same way (a score, then
 * Education / Experience / Skills with ✓ and a faded ✗ per criterion), with the
 * group name in a left column.
 *
 * **A dash, not a ✕ (2026-09-29).** The ✕ was the DS `CloseIcon`, which on
 * every other surface of this product means *dismiss* — and a requirement the
 * matcher did not find is not a thing being thrown out, nor a verdict that the
 * member lacks it. The standup's own notation was "✓ Rust, ✓ 5+ yrs infra,
 * — no protocol experience". Under each line sits one grey line of working:
 * for a met requirement, the profile fact that satisfies it (`evidence`); for
 * an unmet one, "Not on their profile" — the POC reads profiles, so a miss
 * means *not shown*, and a founder who reads it as *doesn't have* throws away
 * a person a message could have settled. The POC's full sentence is the
 * line's `title`; the label is what fits beside a tick.
 *
 * **The network block leads and is not in the count.** "In the network" is what
 * only this product knows — an interest press, a project they worked on, people
 * they have worked with — and there is no honest weight for it in a band. It
 * heads the section because it is the reason a Good match can be worth opening
 * before a Strong one, and it has no check or ✕ because it is a fact, not a
 * requirement. Absent when the member has none.
 *
 * **Edit criteria moved back to the list (2026-10-16).** It sat in this
 * header's action slot (LAB-2819), where as a link it read as text. It is now
 * a bordered "Edit AI criteria" button under the list's tab note,
 * the list's one door to the criteria; `onEditCriteria` stays for a host that
 * wants it here instead. The title says who, in words: "Why we suggested
 * Inês". The evidence under each line reads as the argument (secondary
 * ink); a miss stays faded.
 *
 * **Only requirements that are switched on.** The lead can turn criteria off in
 * Edit criteria; a switched-off one is not part of the count, so listing it
 * with a mark would show a working that does not add up.
 */
export function SuggestedWhy({ person, criteria, off, match, onEditCriteria }: Props) {
  return (
    <DetailsSection>
      <DetailsSectionHeader title={`Why we suggested ${person.name.split(' ')[0]}`}>
        <span className={s.headerRight}>
          <span className={s.count}>
            {match.met} of {match.total} requirements
          </span>
          <MatchBadge band={match.band} />
          {onEditCriteria && (
            <button
              type="button"
              className={clsx(btn.root, btn.xs, btn.link, btn.primary, s.editLink)}
              onClick={onEditCriteria}
            >
              Edit criteria
            </button>
          )}
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
                      <li key={c.id} className={clsx(s.item, { [s.unmet]: !met })} title={c.statement}>
                        <span className={s.mark} aria-hidden="true">
                          {met ? <ReviewCheckIcon size={16} state="bare" /> : <span className={s.dash} />}
                        </span>
                        <span className={s.itemText}>
                          {c.label}
                          <span className={s.srOnly}>{met ? ' — met' : ' — not met'}</span>
                          {/* The fact that earns the tick, or — for a miss —
                              what a miss actually is: the matcher found
                              nothing on the profile, which is not the member
                              lacking it. */}
                          {(!met || person.evidence?.[c.id]) && (
                            <span className={s.evidence}>{met ? person.evidence?.[c.id] : 'Not on their profile'}</span>
                          )}
                        </span>
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
