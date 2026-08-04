'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import type { IJobRole } from '@/types/jobs.types';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import type { Option } from '@/components/form/FormSelect/types';

import { DirectoryMember, RecipientOption } from './types';

import { getGreeting } from './utils/getGreeting';
import { getSignature } from './utils/getSignature';
import { buildEmailTemplate } from './utils/buildEmailTemplate';
import { getRecipientSummary } from './utils/getRecipientSummary';
import { toRecipientOption } from './utils/toRecipientOption';

import { useReferrer } from './hooks/useReferrer';
import { useTeamMembers } from './hooks/useTeamMembers';

import { MemberSearchSelect } from './components/MemberSearchSelect';
import { RecipientPicker } from './components/RecipientPicker';

import { EnvelopeIcon } from '../../icons';

import s from './ReferModal.module.scss';

const MESSAGE_MAX_LENGTH = 800;

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
 * Refer-someone modal: pick a directory member, choose who hears about it, and send a
 * pre-drafted referral note. Sending is still mocked; the people are real — both
 * pickers search `/api/members-search` (see `useMemberSearch`), and the recipients
 * prefilled for the hiring team come from the directory too (see `useTeamMembers`).
 *
 * Chrome is Demo Day's "Make an intro" modal (ReferCompanyModal) — the same job,
 * an intro email to a team, you, and someone you name — with its stylesheet
 * transcribed into `ReferModal.module.scss`: centred envelope / title / desc, 24px
 * card, twin full-width actions. Wrapped in production `Modal` for the portal,
 * escape and scroll-lock the reference hand-rolls.
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

  // Signs the note. Null when signed out, which the template handles by not signing it.
  const referrer = useReferrer();

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

  const draft = () =>
    selectedMember ? buildEmailTemplate({ member: selectedMember, role, teamName, recipients, referrer }) : '';

  // Seed (or re-seed) the template when the candidate, the greeting's basis or the
  // sign-off changes — the referrer's role and team are fetched, so the signature can
  // land a moment after the draft did. A hand-edited note is never overwritten.
  const greetingKey = getGreeting(recipients, teamName);
  const signatureKey = getSignature(referrer);
  useEffect(() => {
    if (!open) return;
    if (!selectedMember) {
      if (!messageEdited) setValue('message', '');
      return;
    }
    if (messageEdited) return;
    setValue('message', draft());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedMember?.uid, greetingKey, signatureKey]);

  // Any keystroke that diverges from the generated template counts as an edit.
  useEffect(() => {
    if (!open || !selectedMember || messageEdited) return;
    if (message && message !== draft()) {
      setMessageEdited(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const resetTemplate = () => {
    if (!selectedMember) return;
    setValue('message', draft());
    setMessageEdited(false);
  };

  const canSend = !!selectedMember && recipients.length > 0 && !!message?.trim();
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
                if (canSend) setSent(true);
              }}
            >
              <div className={s.fields}>
                <MemberSearchSelect
                  name="referee"
                  label="Who are you referring?"
                  placeholder="Search members by name..."
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                />

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

                <div className={`${s.templateBlock} ${selectedMember ? '' : s.templateBlockIdle}`}>
                  <div className={s.templateLabelRow}>
                    <span className={s.templateLabel}>Your note</span>
                    {messageEdited && selectedMember && (
                      <button type="button" className={s.resetLink} onClick={resetTemplate}>
                        Reset to template
                      </button>
                    )}
                  </div>
                  <FormTextArea
                    name="message"
                    placeholder={
                      selectedMember
                        ? 'Tell them why this is a fit...'
                        : 'Pick someone above and we’ll draft the note for you.'
                    }
                    disabled={!selectedMember}
                    // 6, not the 8 the wide gantry shell allowed — the reference card is
                    // narrower, so an empty 8-row box read as a hole in the layout.
                    rows={6}
                    maxLength={MESSAGE_MAX_LENGTH}
                    showCharCount
                  />
                </div>
              </div>

              <p className={s.privacyNote}>
                {recipients.length === 0
                  ? 'Add at least one recipient — a network member or an email address.'
                  : `${sentTo} ${recipients.length === 1 ? 'sees' : 'see'} your name alongside the referral.` +
                    (selectedMember ? ` ${firstName} is notified too.` : '')}
              </p>

              <div className={s.actions}>
                <Button style="border" variant="primary" className={s.actionButton} onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" style="fill" variant="primary" className={s.actionButton} disabled={!canSend}>
                  Send referral
                </Button>
              </div>
            </form>
          </FormProvider>
        )}
      </div>
    </Modal>
  );
}
