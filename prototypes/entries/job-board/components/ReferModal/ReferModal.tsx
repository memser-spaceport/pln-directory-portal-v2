'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import type { IJobRole } from '@/types/jobs.types';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { FormSelect } from '@/components/form/FormSelect';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import type { Option } from '@/components/form/FormSelect/types';

import { RecipientOption } from './types';

import { getGreeting } from './utils/getGreeting';
import { buildEmailTemplate } from './utils/buildEmailTemplate';
import { getRecipientSummary } from './utils/getRecipientSummary';

import { MemberAvatar } from './components/MemberAvatar';
import { RecipientPicker } from './components/RecipientPicker';

import { EnvelopeIcon } from '../../icons';
import { MOCK_MEMBERS, type MockMember } from '../../mockMembers';

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
 * Refer-someone modal (prototype-only, mocked): pick a directory member, choose who
 * hears about it, and send a pre-drafted referral note.
 *
 * Chrome is Demo Day's "Make an intro" modal (ReferCompanyModal) — the same job,
 * an intro email to a team, you, and someone you name — with its stylesheet
 * transcribed into `ReferModal.module.scss`: centred envelope / title / desc, 24px
 * card, twin full-width actions. Wrapped in production `Modal` for the portal,
 * escape and scroll-lock the reference hand-rolls.
 *
 * Candidate and note are production primitives (`FormSelect`, `FormTextArea`);
 * recipients need a picker no production select can express — see `RecipientPicker`.
 */
export function ReferModal({ open, onClose, role, teamName }: ReferModalProps) {
  const [sent, setSent] = useState(false);
  const [messageEdited, setMessageEdited] = useState(false);

  const methods = useForm<ReferFormData>({
    defaultValues: { referee: null, recipients: [], message: '' },
    mode: 'onChange',
  });
  const { control, setValue, reset } = methods;

  const referee = useWatch({ control, name: 'referee' });
  const recipients = useWatch({ control, name: 'recipients' }) ?? [];
  const message = useWatch({ control, name: 'message' });

  const selectedMember: MockMember | null = (referee as any)?.originalObject ?? null;

  const refereeOptions = useMemo<Option[]>(
    () =>
      MOCK_MEMBERS.map((m) => ({
        label: m.name,
        value: m.uid,
        description: `${m.title} · ${m.team}`,
        originalObject: m,
      })),
    [],
  );

  // The hiring team leads the list — they're who a referral is actually for. You
  // can't be both the candidate and someone hearing about the referral, so the
  // person being referred drops out of both groups.
  const teamMembers = useMemo(
    () => MOCK_MEMBERS.filter((m) => m.team === teamName && m.uid !== referee?.value),
    [teamName, referee?.value],
  );

  const networkMembers = useMemo(
    () => MOCK_MEMBERS.filter((m) => m.team !== teamName && m.uid !== referee?.value),
    [teamName, referee?.value],
  );

  // Fresh form every time the modal opens — a referral draft is per-role, not sticky.
  useEffect(() => {
    if (!open) return;
    // Default recipients: whoever in the network is on the hiring team. Empty for
    // teams with no mocked members, which is the "type an email address" case.
    const teamContacts = MOCK_MEMBERS.filter((m) => m.team === teamName).map((m) => ({
      label: m.name,
      value: m.uid,
      description: `${m.title} · ${m.team}`,
    }));
    reset({ referee: null, recipients: teamContacts, message: '' });
    setMessageEdited(false);
    setSent(false);
  }, [open, reset, teamName]);

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

  // Seed (or re-seed) the template when the candidate or the greeting's basis changes.
  // A hand-edited note is never overwritten — "Reset to template" is the way back.
  const greetingKey = getGreeting(recipients, teamName);
  useEffect(() => {
    if (!open) return;
    if (!selectedMember) {
      if (!messageEdited) setValue('message', '');
      return;
    }
    if (messageEdited) return;
    setValue('message', buildEmailTemplate(selectedMember, role, teamName, recipients));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedMember?.uid, greetingKey]);

  // Any keystroke that diverges from the generated template counts as an edit.
  useEffect(() => {
    if (!open || !selectedMember || messageEdited) return;
    if (message && message !== buildEmailTemplate(selectedMember, role, teamName, recipients)) {
      setMessageEdited(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const resetTemplate = () => {
    if (!selectedMember) return;
    setValue('message', buildEmailTemplate(selectedMember, role, teamName, recipients));
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
                {/* The chosen value carries the same avatar + role line as the menu row, so no
                    second "who you picked" card is needed under it. */}
                <FormSelect
                  name="referee"
                  label="Who are you referring?"
                  placeholder="Search members by name..."
                  options={refereeOptions}
                  isClearable
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  renderOption={({ option, label, description }) => (
                    <div className={s.optionRow}>
                      <MemberAvatar name={option.label} size={32} />
                      <div className={s.optionText}>
                        {label}
                        {description}
                      </div>
                    </div>
                  )}
                  formatOptionLabel={(option) => (
                    <span className={s.valueRow}>
                      <MemberAvatar name={option.label} size={24} />
                      <span className={s.valueName}>{option.label}</span>
                      {option.description && <span className={s.valueMeta}>{option.description}</span>}
                    </span>
                  )}
                />

                <RecipientPicker
                  label="Send to"
                  teamMembers={teamMembers}
                  networkMembers={networkMembers}
                  teamName={teamName}
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
