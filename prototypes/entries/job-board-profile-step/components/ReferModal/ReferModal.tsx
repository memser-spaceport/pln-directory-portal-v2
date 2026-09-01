'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import type { IJobRole } from '@/types/jobs.types';

import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import type { Option } from '@/components/form/FormSelect/types';
import { toast } from '@/components/core/ToastContainer';
import { useJobsAnalytics, type JobSurface } from '@/analytics/jobs.analytics';
import fieldCss from '@/components/form/FormMultiSelect/FormMultiSelect.module.scss';
// The note's own description sits above its box rather than in the component's
// below-the-input slot, so its classes are borrowed straight from the component.
import taCss from '@/components/form/FormTextArea/FormTextArea.module.scss';

import { useCreateJobReferral, useJobReferralDraft } from './hooks/useJobReferral';

import { DirectoryMember, RecipientOption } from './types';

import { toReferralRecipient } from './utils/toReferralRecipient';
import { getRecipientSummary } from './utils/getRecipientSummary';

import { useTeamMembers } from './hooks/useTeamMembers';

import { MemberSearchSelect } from './components/MemberSearchSelect';
import { RecipientPicker } from './components/RecipientPicker';

import { EnvelopeIcon } from '../../icons';

import s from './ReferModal.module.scss';

// The backend accepts up to 5000 (`CreateJobReferralSchema`); matching it rather than
// picking a smaller number here, so the field never blocks a note the API would take.
const MESSAGE_MAX_LENGTH = 5000;

// The one line the backend can't draft. `GET .../referral-draft` composes the note
// from both members' directory records, and how the referrer knows the person is in
// nobody's record — so the template carries a bracketed slot for it, its own
// paragraph right after the intro. The backend owns the draft's wording; amending
// the note as it lands is the lever this folder has, and doubles as the proposal
// for the backend template. Skipped if the draft ever starts prompting for it.
function withHowYouKnowSlot(note: string, firstName: string): string {
  if (/how you know/i.test(note)) return note;
  const slot = `[Add a line about how you know ${firstName}.]`;
  const firstBreak = note.indexOf('\n\n');
  return firstBreak === -1 ? `${note}\n\n${slot}` : `${note.slice(0, firstBreak)}\n\n${slot}${note.slice(firstBreak)}`;
}

interface ReferModalProps {
  open: boolean;
  onClose: () => void;
  role: IJobRole;
  teamId: string;
  teamName: string;
  /** Surface the referral was started from, carried onto every event in the funnel. */
  source: JobSurface;
  /** Team-configured inbox. When set, the member picker is hidden and the send skips recipients. */
  jobReferEmail?: string | null;
}

type ReferFormData = {
  referee: Option | null;
  recipients: RecipientOption[];
  message: string;
};

/**
 * Refer a network member for an open role: pick who you're referring, choose who hears
 * about it, and send an intro email.
 *
 * **This folder's copy is mocked end to end** — the pickers, the draft, and the
 * send all run on this entry's mocked records (see `hooks/useMemberSearch`,
 * `hooks/useTeamMembers`, `hooks/useJobReferral`), so any viewer of the demo can
 * walk the whole flow without a session. The `job-board` folder holds the live
 * copy — the one production's jobs page renders — where the draft comes from
 * `GET /job-openings/:uid/referral-draft` and `POST .../referrals` sends it. The
 * only wording either copy adds to the draft is the how-you-know slot (see
 * `withHowYouKnowSlot`); the field makes the rest editable.
 * When the hiring team has a job-refer email the picker is hidden and recipients
 * are omitted; otherwise the first picked member is To and the rest are CCed,
 * plus the referrer and the referred member.
 *
 * Chrome is Demo Day's "Make an intro" modal (ReferCompanyModal) — the same job, an
 * intro email to a team, you, and someone you name — with its stylesheet transcribed
 * into `ReferModal.module.scss`: centred envelope / title / desc, 24px card, twin
 * full-width actions. Wrapped in production `Modal` for the portal, escape and
 * scroll-lock the reference hand-rolls.
 *
 * The note is a production primitive (`FormTextArea`); both people fields search the
 * directory as you type, which no production select can drive — see
 * `MemberSearchSelect` and `RecipientPicker`.
 */
export function ReferModal({ open, onClose, role, teamId, teamName, source, jobReferEmail }: ReferModalProps) {
  const [sent, setSent] = useState(false);
  const [messageEdited, setMessageEdited] = useState(false);
  /* Whether the person being referred is copied on the email.
     Checked by default, because that is what the referral did before this was a
     choice — the default keeps the behaviour, the tick makes it a decision
     rather than something the product does to them behind their back. It is a
     real one: a note is written differently when its subject is reading it. */
  const [copyReferee, setCopyReferee] = useState(true);
  const noteEditedTracked = useRef(false);
  const analytics = useJobsAnalytics();
  const usesTeamReferEmail = Boolean(jobReferEmail?.trim());

  const methods = useForm<ReferFormData>({
    defaultValues: { referee: null, recipients: [], message: '' },
    mode: 'onChange',
  });
  const { control, setValue, reset } = methods;

  const referee = useWatch({ control, name: 'referee' });
  const recipients = useWatch({ control, name: 'recipients' }) ?? [];
  const message = useWatch({ control, name: 'message' });

  const selectedMember: DirectoryMember | null = (referee as any)?.originalObject ?? null;

  const referBase = {
    job_id: role.uid,
    team_id: teamId,
    team_name: teamName,
    role_title: role.roleTitle,
    role_category: role.roleCategory,
    seniority: role.seniority,
    source,
    uses_team_refer_email: usesTeamReferEmail,
  };

  // Only fetched while the modal is open — a job board page holds one of these per role.
  // A team-configured inbox skips the hiring-team lookup: nobody is being picked.
  const { members: hiringTeam, isLoading: isTeamLoading } = useTeamMembers(teamName, open && !usesTeamReferEmail);

  const {
    data: draft,
    isFetching: isDrafting,
    isError: isDraftError,
  } = useJobReferralDraft({
    // The mock composes the note itself, so it takes the member record and the
    // role's facts rather than the uids the live endpoint resolves server-side.
    referredMember: selectedMember,
    roleTitle: role.roleTitle,
    teamName,
    enabled: open,
  });

  const { mutate: sendReferral, isPending: isSending } = useCreateJobReferral(role.uid);

  // The hiring team leads the recipients list — they're who a referral is actually
  // for. You can't be both the candidate and someone hearing about the referral, so
  // the person being referred drops out of it.
  const teamMembers = useMemo(
    () => hiringTeam.filter((member) => member.uid !== referee?.value),
    [hiringTeam, referee?.value],
  );

  // Fresh form every time the modal opens — a referral draft is per-role, not sticky.
  useEffect(() => {
    if (!open) return;
    reset({ referee: null, recipients: [], message: '' });
    setMessageEdited(false);
    setSent(false);
    setCopyReferee(true);
    noteEditedTracked.current = false;
    analytics.onJobReferModalOpened(referBase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  // Nobody is preselected as a recipient. The hiring team's leads used to be seeded
  // into the field; now the team is offered instead — quick-add chips under the
  // field and the head of its resting menu (see `RecipientPicker` /
  // `useTeamMembers`) — a suggestion the referrer confirms with a press, not a To:
  // line they have to audit. Opening empty also lets the caption by the actions
  // ("Add at least one recipient…") say what the field needs.

  // Picking someone as the candidate drops them from the recipient list.
  useEffect(() => {
    if (!open || !referee?.value) return;
    if (recipients.some((r) => r.value === referee.value)) {
      setValue(
        'recipients',
        recipients.filter((r) => r.value !== referee.value),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referee?.value]);

  useEffect(() => {
    if (!open || !selectedMember?.uid) return;
    analytics.onJobReferRefereeSelected({
      ...referBase,
      referred_member_uid: selectedMember.uid,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedMember?.uid]);

  const firstName = selectedMember?.name.split(' ')[0] ?? '';

  // What "Reset to template" returns to: the backend's draft plus the how-you-know slot.
  const templateNote = selectedMember && draft?.note ? withHowYouKnowSlot(draft.note, firstName) : undefined;

  // Show the drafted note as soon as it lands, and clear the field when the candidate is
  // removed. A hand-edited note is never overwritten — "Reset to template" is the way
  // back. The draft depends only on the role and the referred member, so changing
  // recipients no longer re-drafts anything.
  useEffect(() => {
    if (!open) return;
    if (!selectedMember) {
      if (!messageEdited) setValue('message', '');
      return;
    }
    if (messageEdited || !templateNote) return;
    setValue('message', templateNote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedMember?.uid, templateNote]);

  // Any keystroke that diverges from the drafted note counts as an edit.
  useEffect(() => {
    if (!open || !selectedMember || messageEdited || !templateNote) return;
    if (message && message !== templateNote) {
      setMessageEdited(true);
      if (!noteEditedTracked.current) {
        noteEditedTracked.current = true;
        analytics.onJobReferNoteEdited({
          ...referBase,
          referred_member_uid: selectedMember.uid,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const hasExternalEmail = (list: RecipientOption[]) => list.some((r) => Boolean(r.isEmail));

  const handleRecipientsChange = (next: RecipientOption[]) => {
    setValue('recipients', next, { shouldDirty: true });
    if (usesTeamReferEmail) return;
    analytics.onJobReferRecipientsChanged({
      ...referBase,
      recipient_count: next.length,
      has_external_email: hasExternalEmail(next),
    });
  };

  const resetTemplate = () => {
    if (!templateNote || !selectedMember) return;
    setValue('message', templateNote);
    setMessageEdited(false);
    noteEditedTracked.current = false;
    analytics.onJobReferNoteReset({
      ...referBase,
      referred_member_uid: selectedMember.uid,
    });
  };

  const handleClose = () => {
    if (!sent) {
      analytics.onJobReferModalCancelled({
        ...referBase,
        had_referee: Boolean(selectedMember),
        recipient_count: recipients.length,
        note_was_edited: messageEdited,
      });
    }
    onClose();
  };

  const onSubmit = () => {
    if (!selectedMember || !message?.trim()) return;
    if (!usesTeamReferEmail && !recipients.length) return;

    const submitParams = {
      ...referBase,
      referred_member_uid: selectedMember.uid,
      recipient_count: usesTeamReferEmail ? 0 : recipients.length,
      has_external_email: usesTeamReferEmail ? false : hasExternalEmail(recipients),
      note_was_edited: messageEdited,
      copied_referred_member: copyReferee,
    };

    analytics.onJobReferSubmitted(submitParams);

    sendReferral(
      {
        referredMemberUid: selectedMember.uid,
        note: message.trim(),
        recipients: usesTeamReferEmail ? [] : recipients.map(toReferralRecipient),
        /* The proposal for the backend. `POST /job-openings/:uid/referrals` has no
           such field today — it copies the referrer and the referred member
           unconditionally — so this is what the API would need before the tick
           above can mean anything outside this mocked folder. */
        includeReferredMember: copyReferee,
      },
      {
        onSuccess: (result) => {
          analytics.onJobReferSucceeded({
            ...submitParams,
            referral_uid: result?.uid,
          });
          setSent(true);
        },
        onError: (error) => {
          analytics.onJobReferFailed({
            ...submitParams,
            error_type: error instanceof Error ? error.name : 'unknown',
          });
          toast.error('We couldn’t send that referral. Please try again.');
        },
      },
    );
  };

  const canSend = !!selectedMember && !!message?.trim() && !isSending && (usesTeamReferEmail || recipients.length > 0);
  const sentTo = usesTeamReferEmail ? 'the team' : getRecipientSummary(recipients);

  const composingDesc = usesTeamReferEmail
    ? 'One email goes to the address this team set up, with you copied in.'
    : 'One email goes to everyone you add below, with you copied in.';

  /* What stops the send, when something does — nothing else. The two "X sees your
     name alongside the referral, and <First> is notified too" arms are gone: they
     narrated the send instead of letting anyone change it, and the half about the
     referred member is now the tick below, which says the same fact as a decision.
     What survives is a failed draft and the empty-recipients case, which is the
     only thing standing between the person and a disabled Send button. */
  const blockingNote = isDraftError
    ? 'We couldn’t draft a note for that member — write your own, or pick someone else.'
    : undefined;

  /* Named while a member is picked, generic before — the same shape the note's own
     description uses two fields up, so the form asks in one voice. */
  const copyLabel = selectedMember
    ? `Copy ${firstName} on this email`
    : 'Copy the person you’re referring on this email';

  return (
    <Modal isOpen={open} onClose={handleClose} closeOnBackdropClick={false} lockScroll>
      <div className={s.modal}>
        <Button style="link" variant="neutral" className={s.closeButton} onClick={handleClose} aria-label="Close modal">
          <CloseIcon />
        </Button>

        {/* Envelope beside the headline, not stacked above it — one row, with the
            title and its sentence as the column to its right. `.headerSent` puts
            the same three back into a centred stack for the receipt. */}
        <div className={`${s.header} ${sent ? s.headerSent : ''}`}>
          <div className={s.iconWrapper}>
            <EnvelopeIcon />
          </div>

          <div className={s.headerText}>
            <h2 className={s.title}>{sent ? 'Referral sent' : `Refer someone for ${role.roleTitle}`}</h2>

            {/* The sent line has to follow the tick: it used to end "and <First> is
                notified too", which is now the one thing the referrer got to decide.
                Asserting it either way would make the receipt disagree with the form
                they just filled in. */}
            <p className={s.desc}>
              {sent
                ? `Your note is on its way to ${sentTo}. They can reply to you directly.` +
                  (copyReferee ? ` ${firstName} was copied in too.` : '')
                : composingDesc}
            </p>
          </div>
        </div>

        {sent ? (
          <div className={s.actions}>
            <Button style="fill" variant="primary" className={s.actionButton} onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <FormProvider {...methods}>
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              <div className={s.fields}>
                <MemberSearchSelect
                  name="referee"
                  label="Who are you referring?"
                  placeholder="Search members by name..."
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                />

                {usesTeamReferEmail ? (
                  <div className={fieldCss.field}>
                    <span className={fieldCss.label}>Send to</span>
                    <p className={s.teamReferDestination}>
                      This referral will be sent to the email this team set up for job referrals. You can’t choose
                      individual members.
                    </p>
                  </div>
                ) : (
                  <div>
                    <RecipientPicker
                      label="Send to"
                      teamMembers={teamMembers}
                      isTeamLoading={isTeamLoading}
                      teamName={teamName}
                      excludeUids={referee?.value ? [referee.value] : undefined}
                      value={recipients}
                      onChange={handleRecipientsChange}
                      /* No caption. The field opens empty with the picker's own
                         suggestion chips under it, and the caption by the actions
                         ("Add at least one recipient…") already says what the field
                         needs. */
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    />
                  </div>
                )}

                <div className={`${s.templateBlock} ${selectedMember ? '' : s.templateBlockIdle}`}>
                  <div className={s.templateLabelRow}>
                    <span className={s.templateLabel}>Your note</span>
                    {messageEdited && !!templateNote && (
                      <button type="button" className={s.resetLink} onClick={resetTemplate}>
                        Reset to template
                      </button>
                    )}
                  </div>

                  {/* Under the label, above the box — a description of what this
                      field is for, which is read before writing, rather than a
                      hint discovered under the box once the writing is done.

                      Hand-rolled rather than `FormTextArea`'s `description` prop,
                      which renders on the character-counter row *below* the input
                      and has no "top" option. The classes are that component's own
                      (`.fieldDescription` + its `.fieldDescriptionTop` modifier —
                      margin-top 0, margin-bottom 8), which production's `FormField`
                      already uses for exactly this position, so the treatment is
                      the design system's and only the placement is ours. The
                      counter keeps its right edge without the description beside
                      it: `.counter` carries `margin-left: auto`.

                      Standing, not conditional: the ask is the same before and
                      after a draft lands, so the line stays put and only the name
                      joins it — a caption that appears mid-flow reads as a new
                      demand. It points at the bracketed slot the template leaves
                      (see `withHowYouKnowSlot`) and says why it's the referrer's
                      to fill — the one claim nothing else on screen makes. The
                      how-you-know ask lives here alone; the placeholder keeps the
                      general "why this is a fit" so no state says it twice.

                      "Add" and "fill in", not "say" and "write for you": the thing
                      being pointed at is a bracketed blank inside a drafted note,
                      and the slot's own words are "Add a line about how you know
                      <First>". A hint about a blank should use the blank's verb. */}
                  <p id="message-description" className={`${taCss.fieldDescription} ${taCss.fieldDescriptionTop}`}>
                    Add how you know {selectedMember ? firstName : 'the person you’re referring'} — that’s the one thing
                    the draft can’t fill in.
                  </p>

                  {/* Wrapper so the inert state can dim the box alone — see
                      `.templateControl` for why the label and description stay at
                      full strength. */}
                  <div className={s.templateControl}>
                    <FormTextArea
                      name="message"
                      placeholder={
                        selectedMember
                          ? isDrafting
                            ? 'Drafting your note…'
                            : 'Tell them why this is a fit...'
                          : 'Pick someone above and we’ll draft the note for you.'
                      }
                      disabled={!selectedMember || isDrafting}
                      /* Moving the sentence out of the component's own slot would
                         have dropped the association `Field.Description` gave it.
                         `FormTextArea` spreads its rest props onto the `<textarea>`,
                         so it is handed back by hand. */
                      aria-describedby="message-description"
                      // 6, not the 8 the wide gantry shell allowed — the reference card is
                      // narrower, so an empty 8-row box read as a hole in the layout.
                      rows={6}
                      maxLength={MESSAGE_MAX_LENGTH}
                      showCharCount
                    />
                  </div>
                </div>
              </div>

              {/* Only rendered when there is something to say, rather than an
                  always-present slot resolving to an empty string — the note is
                  now a blocker, and a blocker that is absent should take its
                  line with it. */}
              {blockingNote && <p className={s.privacyNote}>{blockingNote}</p>}

              {/* Sits against the send, because that is what it changes: who the
                  press mails. Structure and styles are the apply flow's own footer
                  tick (`JobApplyFlowDrawer`'s `.footerCheck`) — a `<label>` owning
                  the hit area around the DS `Checkbox` — minus its required
                  asterisk, which belongs to a gate and this is an option. */}
              <label className={s.footerCheck}>
                <Checkbox checked={copyReferee} onChange={setCopyReferee} />
                <span>{copyLabel}</span>
              </label>

              <div className={s.actions}>
                <Button style="border" variant="primary" className={s.actionButton} onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" style="fill" variant="primary" className={s.actionButton} disabled={!canSend}>
                  {isSending ? 'Sending…' : 'Send referral'}
                </Button>
              </div>
            </form>
          </FormProvider>
        )}
      </div>
    </Modal>
  );
}
