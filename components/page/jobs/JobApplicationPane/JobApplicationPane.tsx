'use client';

import { useEffect, useMemo } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import clsx from 'clsx';

import type { IJobRole } from '@/types/jobs.types';

import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { Tag } from '@/components/ui/Tag';
import { useMemberExperience, FormattedMemberExperience } from '@/services/members/hooks/useMemberExperience';
import type { IMember } from '@/types/members.types';

// The same two pieces ReferModal uses to draw the hiring team — one source for
// "who is on the other end of this", so the referral modal and the apply modal
// can't end up naming different people. (Prototype-tree import: the same
// existing debt path production ReferRoleRow already takes for ReferModal.)
import { useTeamMembers } from '@/prototypes/entries/job-board/components/ReferModal/hooks/useTeamMembers';
import { MemberAvatar } from '@/prototypes/entries/job-board/components/ReferModal/components/MemberAvatar';
import type { DirectoryMember } from '@/prototypes/entries/job-board/components/ReferModal/types';

// Demo Day's "Make an intro" modal chrome, the same way ReferModal takes it.
import intro from '@/components/page/demo-day/ActiveView/components/TeamsList/components/ReferCompanyModal/ReferCompanyModal.module.scss';
import s from './JobApplicationPane.module.scss';

// 2000 as a validation target, NOT a maxLength attribute: maxLength silently
// truncates pasted text, so the counter goes negative and validation blocks
// the submit instead.
export const COVER_LETTER_MAX_LENGTH = 2000;

const memberHref = (uid: string): string => `/members/${uid}`;

function LeadNames({ shown, total }: { shown: DirectoryMember[]; total: number }) {
  const extra = Math.max(0, total - shown.length);

  const links = shown.map((member) => (
    <a key={member.uid} className={s.leadLink} href={memberHref(member.uid)} target="_blank" rel="noreferrer">
      {member.name.trim().replace(/\s+/g, ' ')}
    </a>
  ));

  const parts: React.ReactNode[] = [];
  links.forEach((link, i) => {
    if (i > 0) parts.push(extra > 0 || i < links.length - 1 ? ', ' : ' and ');
    parts.push(link);
  });
  if (extra > 0) parts.push(` and ${extra} ${extra === 1 ? 'other' : 'others'}`);

  return <>{parts}</>;
}

/** "March 2021 — Present", off the ISO dates the experience API returns. */
function formatExperienceDates(entry: FormattedMemberExperience): string {
  const pretty = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  const start = pretty(entry.startDate);
  const end = entry.isCurrent ? 'Present' : pretty(entry.endDate);
  return [start, end].filter(Boolean).join(' — ');
}

export interface JobApplicationPaneProps {
  role: IJobRole;
  teamName: string;
  /** The member whose profile goes with the application. */
  member: Pick<IMember, 'id' | 'name' | 'role' | 'mainTeam' | 'skills' | 'currentCompany'> | null;
  memberUid: string | undefined;
  /**
   * The letter, owned by the flow rather than by this pane.
   *
   * It has to outlive the pane: stepping back to re-read the posting or to fix
   * the profile unmounts this, and a draft that died on a step change would make
   * the rail a trap. Seeded on mount, reported on every keystroke.
   */
  coverLetter: string;
  onCoverLetterChange: (value: string) => void;
  /** Steps back to the profile — the rail's middle stop, not a modal round trip. */
  onEditProfile: () => void;
  /** The server's refusal, if the last send was refused. Owned by the flow,
   *  because the button that sends is the flow's footer. */
  submitError: string | null;
}

type ApplyFormData = {
  coverLetter: string;
};

/**
 * Apply for a role: your profile, plus the one thing a profile can't say.
 * Promoted from the job-board prototype — see its header for the full design
 * rationale (why the letter is required, why the profile is read-only with an
 * Edit escape, what the read-back deliberately leaves out).
 *
 * `jobSearchStatus` is NEVER rendered in this modal, in any form. It is
 * PL-Team-only by design and does not travel with an application — it is not an
 * oversight and not a missing field; do not "complete" the panel by adding it.
 *
 * Submit semantics (new against the prototype's synchronous mock):
 *  - the guard is the mutation's own `isPending`, checked inside the handler —
 *    the form submits on Enter regardless of what the button looks like;
 *  - close is blocked while a submit is in flight (the letter must survive);
 *  - callbacks are keyed by the role uid captured at mutate time, so a late
 *    result can never close a different role's modal;
 *  - a 409 (already applied) closes and flips the row — the fact is true, and
 *    an error screen for it would be arguing with the person's own history;
 *  - failure keeps the modal open with the letter intact.
 */
/**
 * Step 3: your profile, plus the one thing a profile can't say.
 *
 * **This was a centred modal.** It opened over the drawer that collected the
 * profile it quotes, and `Edit profile` meant tearing this down, rebuilding that
 * drawer, saving, tearing it down and rebuilding this — with the half-written
 * letter shuttled through the board's state to survive the round trip. It is the
 * last stop on a rail now: Edit profile is a step backwards, the letter lives in
 * the flow, and coming back is arriving where you were.
 *
 * What it lost with the chrome: `open`/`onClose`, the mutation, the analytics
 * and the toast. The button that sends is the flow's footer, so everything that
 * happens when it is pressed belongs there too. This collects.
 *
 * `jobSearchStatus` is NEVER rendered here, in any form. It is PL-Team-only by
 * design and does not travel with an application — it is not an oversight and
 * not a missing field; do not "complete" the panel by adding it.
 */
export function JobApplicationPane(props: JobApplicationPaneProps) {
  const { role, teamName, member, memberUid, coverLetter, onCoverLetterChange, onEditProfile, submitError } = props;

  const { defaultRecipients } = useTeamMembers(teamName, true);
  const leads = defaultRecipients.slice(0, 3);

  const experienceQuery = useMemberExperience(memberUid ?? '');
  const primary = useMemo(() => {
    const experiences: FormattedMemberExperience[] = Array.isArray(experienceQuery.data) ? experienceQuery.data : [];
    if (!experiences.length) return null;
    return (
      experiences.find((entry) => entry.isCurrent) ??
      [...experiences].sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))[0]
    );
  }, [experienceQuery.data]);

  const methods = useForm<ApplyFormData>({
    defaultValues: { coverLetter },
    mode: 'onChange',
  });
  const { control, reset } = methods;

  const typed = useWatch({ control, name: 'coverLetter' }) ?? '';

  /* Seeded once per mount from the flow's copy. Stepping away and back remounts
     this pane, and the seed is what makes the letter still be there. */
  useEffect(() => {
    reset({ coverLetter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  /* Reported up on every keystroke, because the flow is where it has to live to
     survive this pane unmounting. */
  useEffect(() => {
    onCoverLetterChange(typed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed]);

  if (!member) return null;

  /* The read-back: the profile's own headline, quoted the way the profile
     displays itself — current role (header precedence), plus the company and
     dates the primary experience entry is the authority for. */
  const roleLine = (member.mainTeam?.role ?? '').trim() || (member.role ?? '').trim();
  /* Same precedence the server uses to compose the application snapshot —
     `currentCompany`, else the main team. A read-back exists to show what is
     being sent, so quoting the experience entry instead (which the server
     never looks at) could name a different company than the email carries. */
  const company = (member.currentCompany ?? '').trim() || (member.mainTeam?.name ?? '').trim();
  const summary = roleLine && company ? `${roleLine} at ${company}` : roleLine || company;
  const skills = (member.skills ?? []).map((skill: { title: string } | string) =>
    typeof skill === 'string' ? skill : skill.title,
  );

  const remaining = COVER_LETTER_MAX_LENGTH - typed.length;
  const overLimit = remaining < 0;

  return (
    <div className={`${intro.modal} ${s.modal} ${s.pane}`}>
      <h2 className={`${intro.title} ${s.headerLeft} ${s.headerTitle}`}>Apply for {role.roleTitle}</h2>

      <p className={`${intro.desc} ${s.headerLeft} ${s.headerDesc}`}>{teamName} receives your profile and this note.</p>

      {leads.length > 0 && (
        <p className={s.leads}>
          <span className={s.leadAvatars}>
            {leads.map((lead) => (
              <a
                key={lead.uid}
                className={s.leadAvatarLink}
                href={memberHref(lead.uid)}
                target="_blank"
                rel="noreferrer"
                aria-hidden="true"
                tabIndex={-1}
              >
                <MemberAvatar name={lead.name} image={lead.image} size={24} className={s.leadAvatar} />
              </a>
            ))}
          </span>
          <span>
            Reviewed by <LeadNames shown={leads} total={defaultRecipients.length} />
          </span>
        </p>
      )}

      <FormProvider {...methods}>
        <form className={`${intro.form} ${s.form}`} onSubmit={(e) => e.preventDefault()}>
          <div className={s.body}>
            <div className={s.block}>
              <div className={s.blockLabelRow}>
                <span className={s.blockLabel}>Your profile</span>
                <button type="button" className={s.editLink} onClick={onEditProfile}>
                  Edit profile
                </button>
              </div>

              <div className={s.profileCard}>
                <p className={s.profileName}>{member.name}</p>
                <p className={s.profileSummary}>{summary}</p>
                {primary && <p className={s.profileDates}>{formatExperienceDates(primary)}</p>}
                {skills.length > 0 && (
                  <div className={s.skills}>
                    {skills.map((skill: string) => (
                      <Tag key={skill} value={skill} variant="default" className={s.skillTag} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={s.block}>
              <div className={s.blockLabelRow}>
                <span className={s.blockLabel}>Cover letter (message for the team)</span>
              </div>
              <FormTextArea name="coverLetter" rows={6} placeholder="Why this role, and what you’d bring to it." />
              <p className={clsx(s.counter, overLimit && s.counterOver)} aria-hidden="true">
                {remaining} {overLimit ? 'over the limit' : 'characters left'}
              </p>
              <p className={s.visuallyHidden} role="status">
                {overLimit
                  ? `Your message is ${-remaining} characters over the ${COVER_LETTER_MAX_LENGTH} character limit.`
                  : ''}
              </p>
            </div>
          </div>

          {/* The note that used to sit above the actions. It stays with the
                field it is about rather than moving to the footer: the footer's
                sentence is about the *press*, and this one is about the letter.
                Its `canSend` branch is gone — "the team can reply to you
                directly" is the footer's line now, beside the button that makes
                it true. */}
          <p className={s.note}>
            {overLimit
              ? `Shorten your note to ${COVER_LETTER_MAX_LENGTH} characters to send it.`
              : 'Add what you did in previous roles that makes you a good fit for this one.'}
          </p>

          {submitError && <p className={s.submitError}>{submitError}</p>}
        </form>
      </FormProvider>
    </div>
  );
}
