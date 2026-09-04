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

import { useCreateJobReferral, useJobReferralDraft } from '@/services/jobs/hooks/useJobReferral';

import { DirectoryMember, RecipientOption } from './types';

import { toReferralRecipient } from './utils/toReferralRecipient';
import { getRecipientSummary } from './utils/getRecipientSummary';

import { useTeamMembers } from './hooks/useTeamMembers';
import { useAutosizeTextarea } from './hooks/useAutosizeTextarea';

import { MemberSearchSelect } from './components/MemberSearchSelect';
import { RecipientPicker } from './components/RecipientPicker';

import { EnvelopeIcon } from '../../icons';

import s from './ReferModal.module.scss';

// The backend accepts up to 5000 (`CreateJobReferralSchema`); matching it rather than
// picking a smaller number here, so the field never blocks a note the API would take.
const MESSAGE_MAX_LENGTH = 5000;

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
 * Lives here but is the component the production jobs page renders (see
 * `components/page/jobs/.../ReferRoleRow`), so it talks to the real API.
 * `GET /job-openings/:uid/referral-draft` composes the note from both members'
 * directory records and the role's apply link — every word of it is the backend's,
 * this file adds none and the field makes it editable — and
 * `POST /job-openings/:uid/referrals` sends it.
 * When the hiring team has a job-refer email the picker is hidden and recipients
 * are omitted; otherwise the first picked member is To and the rest are CCed,
 * plus the referrer and the referred member.
 *
 * Whether the referred member is copied is the referrer's call — `includeReferredMember`
 * on the send. The backend does not read that field yet and CCs them either way. The
 * tick defaults to UNCHECKED, which is the copy people expect but NOT what the backend
 * currently does, so the unticked box is a claim the product cannot yet back. The
 * receipt stays honest regardless — it only ever *adds* "was copied in too" and never
 * claims the negative — so the gap is confined to the checkbox until the backend reads
 * the field.
 *
 * Signed-in only: `ReferRoleRow` sends anonymous visitors to login rather than opening
 * this, and the backend resolves the referrer from the authenticated email. Both calls
 * need a real job-opening uid, so opening this from the mocked `/prototypes/job-board`
 * entry can only get as far as the draft error — that entry demonstrates the layout,
 * not the flow.
 *
 * Chrome is Demo Day's "Make an intro" modal (ReferCompanyModal) — the same job, an
 * intro email to a team, you, and someone you name — with its stylesheet transcribed
 * into `ReferModal.module.scss`: 24px card, twin full-width actions. Its centred
 * envelope / title / desc stack survives only in the *sent* state (`.headerSent`);
 * composing, the masthead is a row, because that state is a form. Wrapped in
 * production `Modal` for the portal, escape and scroll-lock the reference hand-rolls.
 *
 * The note is a production primitive (`FormTextArea`); both people fields search the
 * directory as you type, which no production select can drive — see
 * `MemberSearchSelect` and `RecipientPicker`.
 */
export function ReferModal({ open, onClose, role, teamId, teamName, source, jobReferEmail }: ReferModalProps) {
  const [sent, setSent] = useState(false);
  const [messageEdited, setMessageEdited] = useState(false);
  /* Whether the person being referred is copied on the email.

     **Unchecked by default.** Copying the subject of a referral onto the referral
     is the surprising option, not the expected one — a note is written differently
     when the person it is about is reading it, so the quiet default is the one
     that leaves the referrer free to write plainly, and the tick is how they opt
     into the other thing.

     **A caveat that outlives this line.** The backend does not read
     `includeReferredMember` yet and CCs the referred member either way. While that
     is true an unticked box is the UI's only false note in this flow: it implies a
     person will not be copied, and they will be. The receipt is still safe — it
     only ever *adds* "was copied in too" and never asserts the negative — so the
     exposure is the checkbox alone. Nothing here can fix that; the backend
     honouring the field is what closes it.

     Not reset when the referee changes, only when the modal opens: the choice is
     about the act of sending, not about the person, and re-ticking a box because
     you corrected a name would be surprising. */
  const [copyReferee, setCopyReferee] = useState(false);
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
    jobUid: role.uid,
    referredMemberUid: selectedMember?.uid,
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
    setCopyReferee(false);
    noteEditedTracked.current = false;
    analytics.onJobReferModalOpened(referBase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

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

  /* What "Reset to template" returns to: the backend's draft, verbatim.
     This used to splice a bracketed `[Add a line about how you know <First>.]` into
     the note as it landed. It was the only wording the frontend added, and it made
     the referrer delete text to write their own — in a field whose caption two lines
     down already asks for exactly that, in words, without leaving anything behind to
     clear. One ask, made once, in the place that costs the reader nothing. */
  const templateNote = selectedMember ? draft?.note : undefined;

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

  /* The note has no scrollbar of its own — it grows, and `.fields` does the
     scrolling for the whole form. Two nested scroll regions in one card meant the
     writer lost the shape of what they had written the moment it passed six rows.
     `'message'` is the `id` FormTextArea puts on the textarea (it renders
     `id={name}`); the value dependency is what catches the drafted note landing,
     which no input event would. */
  useAutosizeTextarea('message', message, open);

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
        /* `POST /job-openings/:uid/referrals` has no such field today — it copies the
           referrer and the referred member unconditionally — but its schema is
           non-strict, so this is stripped rather than rejected. Sent now so the tick
           starts meaning something the day the backend honours it. */
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
    ? 'An email is sent to the address this team set up, including you.'
    : 'An email is sent to everyone you add below, including you.';

  /* What stops the send, when something does. Only rendered when there is something
     to say, rather than an always-present slot resolving to an empty string — a
     blocker that is absent should take its line with it.

     Can never appear before a member is picked: the draft query is `enabled` on
     `referredMemberUid`. Informational rather than gating — the field is already
     writable on a failed draft, so the way forward is to type. */
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
      <div className={`${s.modal} ${sent ? s.modalSent : ''}`}>
        <Button style="link" variant="neutral" className={s.closeButton} onClick={handleClose} aria-label="Close modal">
          <CloseIcon />
        </Button>

        {/* The masthead aligns to the state under it, which is why it carries one
            modifier rather than a fixed alignment.

            Composing, the card is a form — a recipient field, a message box, twin
            footer actions — and a form has one left edge that every label and field
            starts from; a centred icon and title over it put two alignment axes in
            one card. So the envelope sits *beside* the headline, with the title and
            its sentence as the column to its right. Sent, there is no form left: one
            sentence and a `Done` button, which is an announcement, and an
            announcement is the thing centring is actually for — `.headerSent` puts
            the same three back into a centred stack.

            The row also buys height. `.modal` is fixed-height with `.fields` as its
            only scroll region, so every chrome row comes out of the fields: stacked,
            this masthead cost ~133px; as a row it costs ~62px, which is what pays
            for the footer tick below. */}
        <div className={`${s.header} ${sent ? s.headerSent : ''}`}>
          <div className={s.iconWrapper}>
            <EnvelopeIcon />
          </div>

          <div className={s.headerText}>
            <h2 className={s.title}>{sent ? 'Referral sent' : `Refer someone for ${role.roleTitle}`}</h2>

            {/* The sent line has to follow the tick: it used to end "and <First> is
                notified too", which is now the one thing the referrer got to decide
                — and which claimed a separate notification that never existed (the
                referred member is CC'd on this one email, nothing more).

                It only ever *adds* a sentence. Nothing here says "was not copied",
                so while the backend still copies them unconditionally the receipt
                can omit a true fact but can never assert a false one. */}
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
                    {/* The second sentence is the one the field can't show. A picker
                        that is simply absent reads as a bug; saying the choice isn't
                        on offer turns it into a rule. */}
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
                      /* No caption. It used to read "Search and select who from the
                         ${teamName} should receive this referral" — the label, the
                         placeholder and the picker's own suggestion chips now say
                         all of that between them. */
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
                      demand.

                      **This is now the only place the how-you-know line is asked
                      for.** The drafted note used to arrive with a bracketed
                      `[Add a line about how you know <First>.]` spliced into it,
                      and this caption pointed at that blank. The blank is gone —
                      it made the referrer clear text before writing, to be told
                      the same thing the caption already tells them — so the
                      sentence now carries the ask on its own. It still says why
                      it's theirs to fill, which is the one claim nothing else on
                      screen makes, and the placeholder still keeps the general
                      "why this is a fit" so no state says it twice.

                      "Add" and "fill in", not "say" and "write for you": what is
                      being asked for is a line the draft leaves out, and the verb
                      should match the act. */}
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

              {blockingNote && <p className={s.privacyNote}>{blockingNote}</p>}

              {/* Sits against the send, because that is what it changes: who the
                  press mails. Structure and styles are the apply flow's own footer
                  tick — a `<label>` owning the hit area around the DS `Checkbox` —
                  minus its required asterisk, which belongs to a gate and this is an
                  option, not a requirement. */}
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
