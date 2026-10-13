'use client';

import clsx from 'clsx';

import { Badge } from '@/components/common/Badge';

// The Monday digest's email shell, imported rather than rebuilt — the stage,
// the client chrome with its subject budget, the white card, masthead, list,
// CTA and footer. The application email on the job board wears the same one;
// two hiring emails drawn two ways would make the format the thing under review.
import digest from '../../newsfeed/Newsfeed.module.scss';
// The application email's review panel, under the card — same scaffolding.
import notes from '../../job-board/email/ApplicationEmailPreview.module.scss';

import { ReviewCheckIcon } from '../icons';
import {
  matchWorking,
  suggestionMatch,
  SUGGESTION_BAND_LABEL,
  SUGGESTION_BAND_VARIANT,
  type RoleCriterion,
  type RoleSuggested,
} from '../mocks';
import s from './SuggestedCandidatesEmail.module.scss';

/** Same sender and budget as the application email (`job-board/email/applicationEmail.ts`). */
const FROM_LINE = 'Protocol Labs Network <jobs@protocol.ai>';
const SUBJECT_BUDGET = 60;
/** How many people the email names. The rest are one line and the CTA. */
const TOP = 3;
/** How many met requirements each named person carries — the email sells, the page triages. */
const MET_SHOWN = 2;

interface Props {
  teamName: string;
  /** The lead the email goes to. */
  recipientName: string;
  roleTitle: string;
  /** Everyone suggested for the role, at or above the floor and already sorted Strong first. */
  people: RoleSuggested[];
  criteria: RoleCriterion[];
  /** The landing: the Candidates page on this role's Suggested tab, optionally on one person. */
  hrefFor: (personId?: string) => string;
}

/**
 * The email a team lead gets when members are suggested for one of their live
 * roles (LAB-2687, Comms). Review surface: `?email=suggested` on team-profile.
 *
 * **What it is for.** Suggestions are the weakest signal on the Candidates
 * page — nobody did anything — so, unlike an application, nothing brings a
 * lead to the Suggested tab. This is that door. It is one of three: this, the
 * bell notification for the same event, and the owner's count line on the
 * role row ("3 applicants · 4 suggested"). All three land on the same place.
 *
 * **The subject is the count and the role.** "4 suggested candidates for
 * Senior Distributed Systems Engineer" — the lead triaging an inbox needs to
 * know it is about hiring, for which role, and roughly how much. Names are the
 * body's job: a subject that leads with one name reads as that person writing.
 * At 62 characters it is two over the budget the digest writes to; the count
 * and "suggested" come first, so a client that cuts it cuts the role title's
 * tail, the half the lead can guess (the application email makes the same
 * trade and says so).
 *
 * **Three people, each with a band and two met requirements.** The band is
 * the page's own word (Strong / Good match, never a number — lesson 26); the
 * two requirements are the first two the profile meets, in the role's order,
 * so the email says *why* in the role's own terms. It shows only what is met:
 * an email is read in seconds and sells a click, while what each person is
 * missing is the page's job, where the whole checklist and its evidence sit
 * beside the profile. Names link to that person's pane; the rest collapse to
 * "and N more"; one CTA, **Review candidates**.
 *
 * **When it sends (the rules, not states — they live here, not on screen):**
 *   - a live role gains suggestions the lead has not been emailed about;
 *   - at most once a week per role, batched — the count is everyone currently
 *     suggested, not only the new ones, because the page it lands on shows
 *     everyone;
 *   - to the team's leads only (who can post and manage the listing), not to
 *     every member, and not to directory admins;
 *   - never for an application (that already has its own email) and never for
 *     an "I'm interested" press, which stays silent by decision.
 *
 * No sign-off: a notification, not a message from a person — the application
 * email's rule.
 */
export function SuggestedCandidatesEmail({ teamName, recipientName, roleTitle, people, criteria, hrefFor }: Props) {
  const count = people.length;
  const noun = count === 1 ? 'candidate' : 'candidates';
  const subject = `${count} suggested ${noun} for ${roleTitle}`;
  const overBudget = subject.length > SUBJECT_BUDGET;
  const top = people.slice(0, TOP);
  const rest = count - top.length;
  const firstNames = top.map((p) => p.name.split(' ')[0]);
  const preview = `${listNames(firstNames, rest)} ${count === 1 ? 'matches' : 'match'} the role on their profiles.`;

  return (
    <div className={s.page}>
      <div className={digest.emailStage}>
        <div className={digest.clientBar}>
          <div className={digest.clientRow}>
            <span className={digest.clientLabel}>From</span>
            <span className={digest.clientValue}>{FROM_LINE}</span>
          </div>
          <div className={digest.clientRow}>
            <span className={digest.clientLabel}>To</span>
            <span className={digest.clientValue}>{recipientName}</span>
          </div>
          <div className={digest.clientRow}>
            <span className={digest.clientLabel}>Subject</span>
            <span className={clsx(digest.clientValue, digest.clientSubject)}>
              {subject}
              <span className={clsx(digest.charCount, overBudget && digest.charCountOver)}>
                {subject.length}/{SUBJECT_BUDGET}
              </span>
            </span>
          </div>
          <div className={digest.clientRow}>
            <span className={digest.clientLabel}>Preview</span>
            <span className={digest.clientValue}>{preview}</span>
          </div>
        </div>

        <div className={digest.email}>
          <header className={digest.emailHead}>
            <p className={digest.masthead}>Protocol Labs Network</p>
          </header>

          <section className={digest.emailSection}>
            {/* The one sentence the list can't say: who these people are and
              that they haven't applied — the same two facts the Suggested
              tab's note leads with, in the same words. */}
            <p className={s.lede}>
              {count} {count === 1 ? 'member' : 'members'} who let hiring teams find them{' '}
              {count === 1 ? 'matches' : 'match'} your <strong>{roleTitle}</strong> role at {teamName}. They haven’t
              applied.
            </p>

            <ul className={digest.emailList}>
              {top.map((p) => {
                const match = suggestionMatch(p, criteria);
                const met = matchWorking(p, criteria).met.slice(0, MET_SHOWN);
                return (
                  <li key={p.id} className={clsx(digest.emailHiringItem, s.person)}>
                    <img className={s.avatar} src={p.avatar} alt="" width={40} height={40} />
                    <div className={s.personText}>
                      <div className={s.nameLine}>
                        <a className={digest.emailItemLink} href={hrefFor(p.id)}>
                          {p.name}
                        </a>
                        <Badge variant={SUGGESTION_BAND_VARIANT[match.band]} className={s.band}>
                          {SUGGESTION_BAND_LABEL[match.band]}
                        </Badge>
                      </div>
                      <span className={s.role}>{p.role}</span>
                      <span className={s.met}>
                        {met.map((c) => (
                          <span key={c.id} className={s.metItem}>
                            <ReviewCheckIcon size={14} state="bare" />
                            {c.label}
                          </span>
                        ))}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {rest > 0 && (
              <p className={s.more}>
                and {rest} more {rest === 1 ? 'match' : 'matches'} on the Candidates page
              </p>
            )}

            <a className={digest.emailCta} href={hrefFor()}>
              Review candidates
            </a>
          </section>

          <footer className={digest.emailFoot}>
            <p>
              You’re getting this because you lead {teamName}, which posted {roleTitle} on the job board. At most one a
              week per role.
            </p>
            <p>
              <a href="/settings/email-preferences">Choose which hiring emails you get</a> ·{' '}
              <a href="/settings/email-preferences">Unsubscribe</a>
            </p>
          </footer>
        </div>

        {/* --- Review scaffolding below this line --- */}
        <div className={notes.notes}>
          <p className={notes.notesTitle}>Where it lands</p>
          <p className={notes.note}>
            Review candidates opens the Candidates page on this role with the Suggested tab open; a name opens that
            person’s pane. The bell carries the same event (notifications-hub).
          </p>
          <p className={notes.note}>
            Sent at most weekly per live role, to its leads only. Applications have their own email; an “I’m interested”
            press sends nothing.
          </p>
        </div>
      </div>
    </div>
  );
}

/** "Inês, Kofi and Yuki" / "Inês, Kofi, Yuki and 1 more". */
function listNames(names: string[], rest: number): string {
  if (rest > 0) return `${names.join(', ')} and ${rest} more`;
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
