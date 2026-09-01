'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import type { IJobRole } from '@/types/jobs.types';

import { Button } from '@/components/common/Button';
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
 * Lives here but is the component the production jobs page renders (see
 * `components/page/jobs/.../ReferRoleRow`), so it talks to the real API.
 * `GET /job-openings/:uid/referral-draft` composes the note from both members'
 * directory records and the role's apply link — the only wording this file adds is
 * the how-you-know slot (see `withHowYouKnowSlot`), the field makes the rest
 * editable — and `POST /job-openings/:uid/referrals` sends it.
 * When the hiring team has a job-refer email the picker is hidden and recipients
 * are omitted; otherwise the first picked member is To and the rest are CCed,
 * plus the referrer and the referred member.
 *
 * Signed-in only: `ReferRoleRow` sends anonymous visitors to login rather than opening
 * this, and the backend resolves the referrer from the authenticated email. Both calls
 * need a real job-opening uid, so opening this from the mocked `/prototypes/job-board`
 * entry can only get as far as the draft error — that entry demonstrates the layout,
 * not the flow.
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

  const { data: draft, isFetching: isDrafting } = useJobReferralDraft({
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
    };

    analytics.onJobReferSubmitted(submitParams);

    sendReferral(
      {
        referredMemberUid: selectedMember.uid,
        note: message.trim(),
        recipients: usesTeamReferEmail ? [] : recipients.map(toReferralRecipient),
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

  return (
    <Modal isOpen={open} onClose={handleClose} closeOnBackdropClick={false} lockScroll>
      <div className={s.modal}>
        <Button style="link" variant="neutral" className={s.closeButton} onClick={handleClose} aria-label="Close modal">
          <CloseIcon />
        </Button>

        {/* The masthead aligns to the state under it, which is why these three
            carry a modifier rather than a fixed alignment.

            Composing, the card is a form — a recipient field, a message box,
            twin footer actions — and a form has one left edge that every label
            and field starts from; a centred icon and title over it put two
            alignment axes in a 400px card. Sent, there is no form left: one
            sentence and a `Done` button, which is an announcement, and an
            announcement is the thing centring is actually for. Same rule the
            apply modal follows (see `.headerLeft` there), applied to a dialog
            that happens to be both kinds of card in turn. */}
        {/* Envelope beside the headline, not stacked above it — one row, with the
            title and its sentence as the column to its right. `.headerSent` puts
            the same three back into a centred stack for the receipt. */}
        <div className={`${s.header} ${sent ? s.headerSent : ''}`}>
          <div className={s.iconWrapper}>
            <EnvelopeIcon />
          </div>

          <div className={s.headerText}>
            <h2 className={s.title}>{sent ? 'Referral sent' : `Refer someone for ${role.roleTitle}`}</h2>

            <p className={s.desc}>
              {sent
                ? `Your note is on its way to ${sentTo}. They can reply to you directly, and ${firstName} is notified too.`
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
                      This referral will be sent to the email this team set up for job referrals.
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
