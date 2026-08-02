'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import type { IJobRole } from '@/types/jobs.types';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { FormSelect } from '@/components/form/FormSelect';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import type { Option } from '@/components/form/FormSelect/types';
import { JOB_QUERY_PARAMS } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';

// Demo Day's "Make an intro" modal, verbatim: the centred envelope / title / desc
// stack, the 24px round card, and the twin full-width footer buttons.
import intro from '@/components/page/demo-day/ActiveView/components/TeamsList/components/ReferCompanyModal/ReferCompanyModal.module.scss';

import { EnvelopeIcon } from './icons';
import { RecipientPicker, isEmailAddress, type RecipientOption } from './RecipientPicker';
import { CURRENT_USER, MOCK_MEMBERS, type MockMember } from './mockMembers';
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

/** Recipients are network members (uid values) or raw email addresses — the value
 *  IS the address for the latter, which is how the two kinds stay distinguishable. */
const isEmailRecipient = (r: RecipientOption) => isEmailAddress(r.value);

function greeting(recipients: RecipientOption[], teamName: string): string {
  const people = recipients.filter((r) => !isEmailRecipient(r));
  // One named person gets a first-name greeting; anything else (several people,
  // an external address, nobody yet) is addressed to the team.
  if (recipients.length === 1 && people.length === 1) {
    return `Hi ${people[0].label.split(' ')[0]},`;
  }
  return `Hi ${teamName} team,`;
}

/** The drafted note the referrer sends. Regenerated whenever the referred person or
 *  the recipient list changes, unless the referrer has already edited it by hand. */
function buildTemplate(member: MockMember, role: IJobRole, teamName: string, recipients: RecipientOption[]): string {
  const where = member.team ? `${member.title} at ${member.team}` : member.title;
  // Same link the row's apply arrow and the share menu use, utm params and all, so
  // a referral that turns into an application is still attributed to the board.
  const jobLink = role.applyUrl ? `${role.applyUrl}?${JOB_QUERY_PARAMS}` : null;

  return [
    greeting(recipients, teamName),
    ``,
    `I'd like to refer ${member.name} for your ${role.roleTitle} role.`,
    ``,
    `${member.name} is ${where}. ${member.signal}`,
    ...(jobLink ? [``, `The role: ${jobLink}`] : []),
    ``,
    `Happy to make the intro whenever you're ready.`,
    ``,
    // The sender is the Directory, not the referrer, so the sign-off is the only
    // thing telling the recipient who actually vouched for this candidate.
    `— ${CURRENT_USER.name}, ${CURRENT_USER.title} at ${CURRENT_USER.team}`,
  ].join('\n');
}

/** "Ana Ruiz", "Ana Ruiz and jobs@ff.org", "Ana Ruiz, Wei Chen, jobs@ff.org and 2 others".
 *  Names are cheaper to read than a count, so it only collapses past three. */
function recipientSummary(recipients: RecipientOption[]): string {
  const labels = recipients.map((r) => r.label);
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length <= 3) return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
  return `${labels.slice(0, 3).join(', ')} and ${labels.length - 3} others`;
}

function MemberAvatar({ name, size }: { name: string; size: number }) {
  return <img src={getDefaultAvatar(name)} alt="" width={size} height={size} className={s.avatar} aria-hidden="true" />;
}

/**
 * Refer-someone modal (prototype-only, mocked): pick a directory member, choose who
 * hears about it, and send a pre-drafted referral note.
 *
 * Chrome is Demo Day's "Make an intro" modal (ReferCompanyModal) — the same job,
 * an intro email to a team, you, and someone you name — reused via its stylesheet:
 * centred envelope / title / desc, 24px card, twin full-width actions. Wrapped in
 * production `Modal` for the portal, escape and scroll-lock the reference hand-rolls.
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

  // The sender is never a candidate or a recipient — they're the one writing, and
  // they're already on the thread.
  const selectableMembers = useMemo(() => MOCK_MEMBERS.filter((m) => m.uid !== CURRENT_USER.uid), []);

  const refereeOptions = useMemo<Option[]>(
    () =>
      selectableMembers.map((m) => ({
        label: m.name,
        value: m.uid,
        description: `${m.title} · ${m.team}`,
        originalObject: m,
      })),
    [selectableMembers],
  );

  // The hiring team leads the list — they're who a referral is actually for. You
  // can't be both the candidate and someone hearing about the referral, so the
  // person being referred drops out of both groups.
  const teamMembers = useMemo(
    () => selectableMembers.filter((m) => m.team === teamName && m.uid !== referee?.value),
    [selectableMembers, teamName, referee?.value],
  );
  const networkMembers = useMemo(
    () => selectableMembers.filter((m) => m.team !== teamName && m.uid !== referee?.value),
    [selectableMembers, teamName, referee?.value],
  );

  // Fresh form every time the modal opens — a referral draft is per-role, not sticky.
  useEffect(() => {
    if (!open) return;
    // Default recipients: whoever in the network is on the hiring team. Empty for
    // teams with no mocked members, which is the "type an email address" case.
    const teamContacts = MOCK_MEMBERS.filter((m) => m.team === teamName && m.uid !== CURRENT_USER.uid).map((m) => ({
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
  const greetingKey = greeting(recipients, teamName);
  useEffect(() => {
    if (!open) return;
    if (!selectedMember) {
      if (!messageEdited) setValue('message', '');
      return;
    }
    if (messageEdited) return;
    setValue('message', buildTemplate(selectedMember, role, teamName, recipients));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedMember?.uid, greetingKey]);

  // Any keystroke that diverges from the generated template counts as an edit.
  useEffect(() => {
    if (!open || !selectedMember || messageEdited) return;
    if (message && message !== buildTemplate(selectedMember, role, teamName, recipients)) {
      setMessageEdited(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const resetTemplate = () => {
    if (!selectedMember) return;
    setValue('message', buildTemplate(selectedMember, role, teamName, recipients));
    setMessageEdited(false);
  };

  const canSend = !!selectedMember && recipients.length > 0 && !!message?.trim();
  const firstName = selectedMember?.name.split(' ')[0] ?? '';
  const sentTo = recipientSummary(recipients);

  return (
    <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false} lockScroll>
      <div className={`${intro.modal} ${s.modal}`}>
        <button type="button" className={intro.closeButton} onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </button>

        <div className={intro.iconWrapper}>
          <EnvelopeIcon />
        </div>

        <h2 className={intro.title}>{sent ? 'Referral sent' : `Refer someone for ${role.roleTitle}`}</h2>

        <p className={intro.desc}>
          {sent
            ? `Your note is on its way to ${sentTo}, signed with your name. You're copied on it, and ${firstName} is notified too.`
            : `This will send an intro email from the Directory to ${teamName}, yourself, and the people you list below.`}
        </p>

        {sent ? (
          <div className={intro.actions}>
            <button type="button" className={intro.submitButton} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <FormProvider {...methods}>
            <form
              className={`${intro.form} ${s.form}`}
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
                  description="The first person on the list gets the email directly, everyone else is CC’d."
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
                  : `Sent from the Directory and signed ${CURRENT_USER.name}, so ${sentTo} ${
                      recipients.length === 1 ? 'knows' : 'know'
                    } who referred${selectedMember ? ` ${firstName}` : ''}.`}
              </p>

              <div className={intro.actions}>
                <button type="button" className={intro.cancelButton} onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className={intro.submitButton} disabled={!canSend}>
                  Send referral
                </button>
              </div>
            </form>
          </FormProvider>
        )}
      </div>
    </Modal>
  );
}
