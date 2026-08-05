'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import type { IJobReferralRecipient, IJobRole } from '@/types/jobs.types';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import type { Option } from '@/components/form/FormSelect/types';
import { toast } from '@/components/core/ToastContainer';

import { useCreateJobReferral, useJobReferralDraft } from '@/services/jobs/hooks/useJobReferral';

import { DirectoryMember, RecipientOption } from './types';

import { toRecipientOption } from './utils/toRecipientOption';
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

interface ReferModalProps {
  open: boolean;
  onClose: () => void;
  role: IJobRole;
  teamName: string;
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
 * directory records and the role's apply link — no wording lives in this file, the
 * field just makes it editable — and `POST /job-openings/:uid/referrals` sends it,
 * making the first recipient the To and CCing the rest, plus the referrer and the
 * referred member.
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
export function ReferModal({ open, onClose, role, teamName }: ReferModalProps) {
  const [sent, setSent] = useState(false);
  const [messageEdited, setMessageEdited] = useState(false);
  const [recipientsSeeded, setRecipientsSeeded] = useState(false);

  const methods = useForm<ReferFormData>({
    defaultValues: { referee: null, recipients: [], message: '' },
    mode: 'onChange',
  });
  const { control, setValue, reset } = methods;

  const referee = useWatch({ control, name: 'referee' });
  const recipients = useWatch({ control, name: 'recipients' }) ?? [];
  const message = useWatch({ control, name: 'message' });

  const selectedMember: DirectoryMember | null = (referee as any)?.originalObject ?? null;

  // Only fetched while the modal is open — a job board page holds one of these per role.
  const { members: hiringTeam, defaultRecipients, isLoading: isTeamLoading } = useTeamMembers(teamName, open);

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
    setRecipientsSeeded(false);
  }, [open, reset]);

  // Default recipients: the hiring team's leads (see `useTeamMembers`). Seeded in its
  // own pass because the team is fetched — it can land after the modal is already on
  // screen — and only ever once per open, so it can't wipe an edit made in the
  // meantime. Teams the directory has no members for seed nothing, which is the
  // "type an email address" case.
  useEffect(() => {
    if (!open || recipientsSeeded || isTeamLoading) return;
    if (defaultRecipients.length) {
      setValue('recipients', defaultRecipients.map(toRecipientOption));
    }
    setRecipientsSeeded(true);
  }, [open, recipientsSeeded, isTeamLoading, defaultRecipients, setValue]);

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
    if (messageEdited || !draft?.note) return;
    setValue('message', draft.note);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedMember?.uid, draft?.note]);

  // Any keystroke that diverges from the drafted note counts as an edit.
  useEffect(() => {
    if (!open || !selectedMember || messageEdited || !draft?.note) return;
    if (message && message !== draft.note) {
      setMessageEdited(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const resetTemplate = () => {
    if (!draft?.note) return;
    setValue('message', draft.note);
    setMessageEdited(false);
  };

  const onSubmit = () => {
    if (!selectedMember || !recipients.length || !message?.trim()) return;

    sendReferral(
      {
        referredMemberUid: selectedMember.uid,
        recipients: recipients.map(toReferralRecipient),
        note: message.trim(),
      },
      {
        onSuccess: () => setSent(true),
        onError: () => toast.error('We couldn’t send that referral. Please try again.'),
      },
    );
  };

  const canSend = !!selectedMember && recipients.length > 0 && !!message?.trim() && !isSending;
  const firstName = selectedMember?.name.split(' ')[0] ?? '';
  const sentTo = getRecipientSummary(recipients);

  return (
    <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false} lockScroll>
      <div className={s.modal}>
        <Button style="link" variant="neutral" className={s.closeButton} onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </Button>

        <div className={s.iconWrapper}>
          <EnvelopeIcon />
        </div>

        <h2 className={s.title}>{sent ? 'Referral sent' : `Refer someone for ${role.roleTitle}`}</h2>

        <p className={s.desc}>
          {sent
            ? `Your note is on its way to ${sentTo}. They can reply to you directly, and ${firstName} is notified too.`
            : `This will send an intro email to ${teamName}, yourself, and the people you list below.`}
        </p>

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

                <div>
                  <RecipientPicker
                    label="Send to"
                    teamMembers={teamMembers}
                    isTeamLoading={isTeamLoading}
                    teamName={teamName}
                    excludeUids={referee?.value ? [referee.value] : undefined}
                    value={recipients}
                    onChange={(next) => setValue('recipients', next, { shouldDirty: true })}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  />
                  <div className={s.hint}>
                    The first person on the list gets the email directly, everyone else is CC’d.
                  </div>
                </div>

                <div className={`${s.templateBlock} ${selectedMember ? '' : s.templateBlockIdle}`}>
                  <div className={s.templateLabelRow}>
                    <span className={s.templateLabel}>Your note</span>
                    {messageEdited && !!draft?.note && (
                      <button type="button" className={s.resetLink} onClick={resetTemplate}>
                        Reset to template
                      </button>
                    )}
                  </div>
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
                    // 6, not the 8 the wide gantry shell allowed — the reference card is
                    // narrower, so an empty 8-row box read as a hole in the layout.
                    rows={6}
                    maxLength={MESSAGE_MAX_LENGTH}
                    showCharCount
                  />
                </div>
              </div>

              <p className={s.privacyNote}>
                {isDraftError
                  ? 'We couldn’t draft a note for that member — write your own, or pick someone else.'
                  : recipients.length === 0
                    ? 'Add at least one recipient — a network member or an email address.'
                    : `${sentTo} ${recipients.length === 1 ? 'sees' : 'see'} your name alongside the referral.` +
                      (selectedMember ? ` ${firstName} is notified too.` : '')}
              </p>

              <div className={s.actions}>
                <Button style="border" variant="primary" className={s.actionButton} onClick={onClose}>
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
