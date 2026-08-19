'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import clsx from 'clsx';

import type { IJobRole } from '@/types/jobs.types';

import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { Tag } from '@/components/ui/Tag';
import { toast } from '@/components/core/ToastContainer';

import { useSubmitJobApplication } from '@/services/jobs/hooks/useJobApplications';
import { isAlreadyAppliedError } from '@/services/jobs/job-applications.service';
import { useMemberExperience, FormattedMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { useJobsAnalytics, type JobSurface } from '@/analytics/jobs.analytics';
import type { BoardViewerState } from '@/services/jobs/job-board-viewer';
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
import s from './JobApplyModal.module.scss';

// 2000 as a validation target, NOT a maxLength attribute: maxLength silently
// truncates pasted text, so the counter goes negative and validation blocks
// the submit instead.
const COVER_LETTER_MAX_LENGTH = 2000;

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

interface JobApplyModalProps {
  open: boolean;
  onClose: () => void;
  role: IJobRole | null;
  teamId: string;
  teamName: string;
  /** The member whose profile goes with the application — complete when this opens. */
  member: Pick<IMember, 'id' | 'name' | 'role' | 'mainTeam' | 'skills'> | null;
  memberUid: string | undefined;
  /** For the analytics payload — never anything beyond uids/state/source. */
  viewerState: BoardViewerState;
  source: JobSurface;
  /** Closes this modal and opens the profile drawer in place, carrying the letter. */
  onEditProfile: (coverLetter: string) => void;
  /** The preserved draft when the person has just come back from the drawer. */
  initialCoverLetter: string;
  /** Fires after a submit lands (success or 409-already-applied). */
  onSubmitted: () => void;
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
export function JobApplyModal(props: JobApplyModalProps) {
  const {
    open,
    onClose,
    role,
    teamId,
    teamName,
    member,
    memberUid,
    viewerState,
    source,
    onEditProfile,
    initialCoverLetter,
    onSubmitted,
  } = props;

  const analytics = useJobsAnalytics();
  const { defaultRecipients } = useTeamMembers(teamName, open);
  const leads = defaultRecipients.slice(0, 3);

  const submitMutation = useSubmitJobApplication(memberUid);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // The uid this modal is currently submitting for — a late mutation result
  // must only act if the modal still shows the same role.
  const inFlightRoleUid = useRef<string | null>(null);

  const experienceQuery = useMemberExperience(memberUid ?? '');
  const experiences: FormattedMemberExperience[] = Array.isArray(experienceQuery.data) ? experienceQuery.data : [];
  const primary = useMemo(() => {
    if (!experiences.length) return null;
    return experiences.find((entry) => entry.isCurrent) ?? [...experiences].sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))[0];
  }, [experiences]);

  const methods = useForm<ApplyFormData>({
    defaultValues: { coverLetter: '' },
    mode: 'onChange',
  });
  const { control, reset } = methods;

  const coverLetter = useWatch({ control, name: 'coverLetter' }) ?? '';

  /* Seeded from the parent on every open — '' for a fresh application, the
     preserved draft after the drawer round trip. `initialCoverLetter` is
     deliberately out of the deps: it only changes while the modal is closed. */
  useEffect(() => {
    if (!open) return;
    reset({ coverLetter: initialCoverLetter });
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  if (!role || !member) return null;

  /* The read-back: the profile's own headline, quoted the way the profile
     displays itself — current role (header precedence), plus the company and
     dates the primary experience entry is the authority for. */
  const roleLine = (member.mainTeam?.role ?? '').trim() || (member.role ?? '').trim();
  const company = (primary?.company ?? member.mainTeam?.name ?? '').trim();
  const summary = roleLine && company ? `${roleLine} at ${company}` : roleLine || company;
  const skills = (member.skills ?? []).map((skill: { title: string } | string) =>
    typeof skill === 'string' ? skill : skill.title,
  );

  const remaining = COVER_LETTER_MAX_LENGTH - coverLetter.length;
  const overLimit = remaining < 0;
  const canSend = coverLetter.trim().length > 0 && !overLimit;

  const analyticsBase = {
    job_id: role.uid,
    team_id: teamId,
    viewer_state: viewerState,
    source,
  };

  const submit = () => {
    // isPending inside the handler, not just the button: Enter submits the form
    // no matter what the button looks like.
    if (!canSend || submitMutation.isPending) return;
    setSubmitError(null);

    const submittedRoleUid = role.uid;
    inFlightRoleUid.current = submittedRoleUid;

    analytics.onJobApplySubmitted({ ...analyticsBase, cover_letter_length: coverLetter.trim().length });

    submitMutation.mutate(
      { roleUid: submittedRoleUid, teamUid: teamId, coverLetter: coverLetter.trim() },
      {
        onSuccess: () => {
          if (inFlightRoleUid.current !== submittedRoleUid) return;
          inFlightRoleUid.current = null;
          onSubmitted();
          toast.success(`Applied to ${role.roleTitle} at ${teamName}. Your profile went with your note.`);
        },
        onError: (error) => {
          if (inFlightRoleUid.current !== submittedRoleUid) return;
          inFlightRoleUid.current = null;
          if (isAlreadyAppliedError(error)) {
            // The server already holds this application — the row flips to
            // Applied (the hook refetches the map) and the modal closes on the
            // true state rather than erroring about it.
            analytics.onJobApplyFailed({ ...analyticsBase, failure_category: 'already-applied' });
            onSubmitted();
            toast.success(`You had already applied to ${role.roleTitle} at ${teamName}.`);
            return;
          }
          analytics.onJobApplyFailed({ ...analyticsBase, failure_category: 'request-failed' });
          setSubmitError('Something went wrong and the application was not sent. Your note is still here — try again.');
        },
      },
    );
  };

  /* Close is blocked while a submit is in flight: Escape mid-flight would clear
     the flow state, and a failure arriving after that would have nowhere to put
     the letter back. */
  const guardedClose = () => {
    if (submitMutation.isPending) return;
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={guardedClose} closeOnBackdropClick={false} lockScroll>
      <div className={`${intro.modal} ${s.modal}`}>
        <button type="button" className={intro.closeButton} onClick={guardedClose} aria-label="Close">
          <CloseIcon />
        </button>

        <h2 className={`${intro.title} ${s.headerLeft} ${s.headerTitle}`}>Apply for {role.roleTitle}</h2>

        <p className={`${intro.desc} ${s.headerLeft} ${s.headerDesc}`}>
          {teamName} receives your profile and this note.
        </p>

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
          <form
            className={`${intro.form} ${s.form}`}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className={s.body}>
              <div className={s.block}>
                <div className={s.blockLabelRow}>
                  <span className={s.blockLabel}>Your profile</span>
                  <button type="button" className={s.editLink} onClick={() => onEditProfile(coverLetter)}>
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
                  {overLimit ? `Your message is ${-remaining} characters over the ${COVER_LETTER_MAX_LENGTH} character limit.` : ''}
                </p>
              </div>
            </div>

            <p className={s.note}>
              {canSend
                ? `${teamName} can reply to you directly.`
                : overLimit
                  ? `Shorten your note to ${COVER_LETTER_MAX_LENGTH} characters to send it.`
                  : 'Add what you did in previous roles that makes you a good fit for this one.'}
            </p>

            {submitError && <p className={s.submitError}>{submitError}</p>}

            <div className={intro.actions}>
              <button
                type="button"
                className={intro.cancelButton}
                onClick={guardedClose}
                disabled={submitMutation.isPending}
              >
                Cancel
              </button>
              <button type="submit" className={intro.submitButton} disabled={!canSend || submitMutation.isPending}>
                {submitMutation.isPending ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
}
