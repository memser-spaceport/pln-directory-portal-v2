'use client';

import { useState } from 'react';
import clsx from 'clsx';

import { MatchBadge } from '../MatchBadge';

// The Monday digest's email shell, imported rather than rebuilt — the stage,
// the client chrome with its subject budget, the white card, masthead, list,
// CTA and footer. The application email on the job board wears the same one;
// two hiring emails drawn two ways would make the format the thing under review.
import digest from '../../newsfeed/Newsfeed.module.scss';
// The application email's review panel, under the card — same scaffolding.
import notes from '../../job-board/email/ApplicationEmailPreview.module.scss';

import {
  suggestionMatch,
  suggestionWhyFact,
  type RoleCriterion,
  type RoleSuggested,
} from '../mocks';
import s from './SuggestedCandidatesEmail.module.scss';

/** Same sender and budget as the application email (`job-board/email/applicationEmail.ts`). */
const FROM_LINE = 'Protocol Labs Network <jobs@protocol.ai>';
const SUBJECT_BUDGET = 60;
/** How many people the email names. The rest are one link. */
const TOP = 3;

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
  /** The posting, so the role title is a link — a team can have several roles named alike. */
  postingHref?: string;
  /** One sentence from the posting: which role, in case the title alone doesn't say. */
  roleSummary?: string;
}

/**
 * The email a team lead gets when members are suggested for one of their live
 * roles (LAB-2687, Comms; the card layout is LAB-2809 option 3, built in
 * LAB-2819). Review surface: `?email=suggested` on team-profile.
 *
 * **What it is for.** Suggestions are the weakest signal on the Candidates
 * page — nobody did anything — so, unlike an application, nothing brings a
 * lead to the Suggested tab. This is that door. It is one of three: this, the
 * bell notification for the same event, and the owner's count line on the
 * role row ("3 applicants · 5 suggested"). All three land on the same place.
 *
 * **The subject is the count and the role.** "5 suggested candidates for
 * Senior Distributed Systems Engineer" — the lead triaging an inbox needs to
 * know it is about hiring, for which role, and roughly how much. Names are the
 * body's job: a subject that leads with one name reads as that person writing.
 * At 62 characters it is two over the budget the digest writes to; the count
 * and "suggested" come first, so a client that cuts it cuts the role title's
 * tail, the half the lead can guess (the application email makes the same
 * trade and says so).
 *
 * **At most three cards, and each card is the link.** Photo + full name and
 * the band (the page's own word — Strong / Good match, never a number,
 * lesson 26); then title · company, location; then ONE why line — a fact
 * from their profile (`suggestionWhyFact`: a strong network tie wins, else the
 * evidence behind the role's most important met requirement), never the
 * requirement's text and never a "strength" label; then "N of M
 * requirements" and "View profile →". The checklist ("Why we suggested", the
 * ticks, faded met items) was cut 2026-11-05: three near-identical lists made
 * the cards indistinguishable. What each person is missing is the page's job.
 *
 * **One number.** The lede's total and the button's ("All 5 matches for this
 * role") are the same `people.length`; the lede adds "Here are the strongest
 * 3" only when there are more than three.
 *
 * **The page is behind sign-in.** There is no public candidate page (Polina,
 * LAB-2809), so a card a signed-out lead taps goes through sign-in first and
 * comes back to that person (LAB-2818 for production).
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
export function SuggestedCandidatesEmail({
  teamName,
  recipientName,
  roleTitle,
  people,
  criteria,
  hrefFor,
  postingHref,
  roleSummary,
}: Props) {
  const count = people.length;
  const noun = count === 1 ? 'candidate' : 'candidates';
  const subject = `${count} suggested ${noun} for ${roleTitle}`;
  const overBudget = subject.length > SUBJECT_BUDGET;
  const top = people.slice(0, TOP);
  const rest = count - top.length;
  const firstNames = top.map((p) => p.name.split(' ')[0]);
  const preview = `${listNames(firstNames, rest)} ${count === 1 ? 'matches' : 'match'} the role on their profiles.`;
  const [stopped, setStopped] = useState(false);

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
            {/* The one sentence the cards can't say: who these people are and
              that they haven't applied. */}
            <p className={s.lede}>
              {count} {count === 1 ? 'member' : 'members'} of the Protocol Labs network{' '}
              {count === 1 ? 'matches' : 'match'} your{' '}
              {postingHref ? (
                <a className={s.roleLink} href={postingHref}>
                  {roleTitle}
                </a>
              ) : (
                <strong>{roleTitle}</strong>
              )}{' '}
              role at {teamName}.{rest > 0 && ` Here are the strongest ${top.length}.`}{' '}
              {count === 1 ? 'They haven’t' : 'None have'} applied yet.
            </p>
            {/* Which role, in a sentence from the posting (review 2026-10-13): a
                team with several similar titles can't tell them apart by name. */}
            {roleSummary && <p className={s.roleSummary}>{roleSummary}</p>}

            <ul className={s.cards}>
              {top.map((p) => {
                const match = suggestionMatch(p, criteria);
                const why = suggestionWhyFact(p, criteria);
                return (
                  <li key={p.id}>
                    <a className={s.card} href={hrefFor(p.id)}>
                      {/* Who, first: photo + full name, so three cards for one
                          role read as three people (2026-11-05). */}
                      <span className={s.head}>
                        <img className={s.avatar} src={p.avatar} alt="" width={40} height={40} />
                        <span className={s.personText}>
                          <span className={s.nameLine}>
                            <span className={s.name}>{p.name}</span>
                            <MatchBadge band={match.band} />
                          </span>
                          <span className={s.role}>
                            {[p.title, p.team].filter(Boolean).join(' · ')}
                            {p.location && `, ${p.location}`}
                          </span>
                        </span>
                      </span>
                      {/* One why line: a fact from their profile, never the
                          requirement's own words — see suggestionWhyFact. */}
                      {why && <span className={s.why}>{why}</span>}
                      <span className={s.count}>
                        {match.met} of {match.total} requirements
                      </span>
                      {/* A span, not a link: the whole card is the link. */}
                      <span className={s.viewProfile}>View profile →</span>
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* The total — the lede's number — as the one button to the whole list. */}
            {rest > 0 && (
              <div className={s.ctaRow}>
                <a className={digest.emailCta} href={hrefFor()}>
                  All {count} matches for this role
                </a>
              </div>
            )}
          </section>

          <footer className={digest.emailFoot}>
            <p>
              You’re getting this because you lead {teamName}, which posted {roleTitle} on the job board. At most one a
              week per role.
            </p>
            {stopped ? (
              <p role="status">You won’t get suggested-candidate emails any more.</p>
            ) : (
              <p>
                {/* One click, no page: the link itself is the unsubscribe. The
                    prototype records nothing. */}
                <a
                  href="#stop"
                  onClick={(e) => {
                    e.preventDefault();
                    setStopped(true);
                  }}
                >
                  Stop these emails
                </a>{' '}
                · <a href="/settings/email">Email settings</a>
              </p>
            )}
          </footer>
        </div>

        {/* --- Review scaffolding below this line --- */}
        <div className={notes.notes}>
          <p className={notes.notesTitle}>Where it lands</p>
          <p className={notes.note}>
            A card opens the Candidates page on this role, Suggested tab, on that person — after sign-in, because the
            page is for signed-in leads only. “All N matches for this role” opens the same list with nobody picked. The bell carries the
            same event (notifications-hub).
          </p>
          <p className={notes.note}>
            Here the links add <code>&amp;signedout=1</code> so the prototype plays the sign-in step. Production’s link
            is <code>/teams/&lt;id&gt;/candidates?role=&lt;roleUid&gt;&amp;suggested=&lt;memberUid&gt;</code>.
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
