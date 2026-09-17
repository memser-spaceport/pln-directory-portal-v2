'use client';

import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { CloseIcon } from '@/components/icons';

import s from './OpenRoleInterestModal.module.scss';

/**
 * What a person says to a team that has no posting for them.
 *
 * **A dialog, not a step in the apply drawer.** The prototype puts this step
 * inside that drawer, beside review/profile/application — but that flow is built
 * around an `IJobRole` from its state union down to its back-targets, and this
 * signal has no role. The prototype's own history is the argument for the
 * smaller shape here: it *was* a centred dialog ("no description to read and one
 * text box") and only became a step when the route grew a profile review in
 * front of the message. We are not building that review — see below — so the
 * dialog is what is left, and it is the shape every other ask on this board
 * takes.
 *
 * **No profile read-back.** In the prototype the profile is quoted above the
 * field with an `Edit profile` link beside it, which works because the profile
 * is the step behind it: pressing Edit is a step change in the same container.
 * From a dialog it would have to close itself and open a drawer — the exact
 * round trip the prototype moved away from. The profile still travels with the
 * signal; what is missing is only the quotation of it, and a link that tears the
 * dialog down is worse than its absence.
 *
 * **One field, and it is required.** Everything else a hiring team needs — name,
 * role, experience, skills, the CV — is on the profile and goes with the signal,
 * so asking for it here would be asking someone to retype what the account
 * exists to hold. The server takes the message as optional; this asks for it
 * anyway, because a talent-pool entry with nothing to read is a row a recruiter
 * cannot act on. That is the prototype's own reversal: it was optional once, on
 * the argument that the press is the signal.
 *
 * **Nothing here offers to take it back.** The signal is one-way — see
 * `markTeamInterest` — and the copy must not imply otherwise.
 */

const NOTE_MAX = 1000;

export const openRoleModalTitle = (teamName: string) => `Didn't find your role at ${teamName}?`;
export const openRoleModalLede = (teamName: string) => `Let ${teamName} know what you're looking for.`;
export const OPEN_ROLE_NOTE_LABEL = "Express what you're interested in";
export const OPEN_ROLE_SEND_LABEL = 'Send';

interface InterestFormData {
  message: string;
}

interface OpenRoleInterestModalProps {
  teamName: string;
  isOpen: boolean;
  /** The send is in flight — the footer waits rather than accepting a second press. */
  isSending?: boolean;
  /** The server's own refusal from the last attempt, if there was one. */
  error?: string | null;
  onClose: () => void;
  onSend: (message: string) => void;
}

export function OpenRoleInterestModal(props: OpenRoleInterestModalProps) {
  const { teamName, isOpen, isSending = false, error, onClose, onSend } = props;

  const methods = useForm<InterestFormData>({
    defaultValues: { message: '' },
    mode: 'onChange',
  });
  const { control, handleSubmit } = methods;

  /* Gated on the value, NOT on `formState.isValid`.
     `FormTextArea`'s `isRequired` only styles the label — it registers the field
     with no rules — so `isValid` is true on an empty message and a Send button
     trusting it would accept nothing. The prop stays for the asterisk it draws;
     the rule lives here. */
  const message = useWatch({ control, name: 'message' }) ?? '';
  const canSend = message.trim().length > 0 && !isSending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabelledBy="open-role-interest-title" lockScroll>
      <div className={s.modal}>
        <Button style="link" variant="neutral" className={s.closeButton} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </Button>

        <div className={s.head}>
          <h2 id="open-role-interest-title" className={s.title}>
            {openRoleModalTitle(teamName)}
          </h2>
          <p className={s.lede}>{openRoleModalLede(teamName)}</p>
        </div>

        <FormProvider {...methods}>
          {/* A real form, so Enter in the field sends rather than doing nothing
              — the footer's Send is its submit button. */}
          <form
            className={s.body}
            onSubmit={handleSubmit((values) => {
              /* Re-checked here because nothing else can: with no registered
                 rules `handleSubmit` runs its handler unconditionally, so an
                 Enter press in the field would otherwise send an empty note. */
              const note = values.message.trim();
              if (!note || isSending) return;
              onSend(note);
            })}
          >
            <FormTextArea
              name="message"
              label={OPEN_ROLE_NOTE_LABEL}
              isRequired
              placeholder={`A few lines on what you'd like to do and why ${teamName}.`}
              rows={8}
              maxLength={NOTE_MAX}
              showCharCount
            />

            {error && <p className={s.error}>{error}</p>}

            <div className={s.footer}>
              <Button type="button" size="s" style="border" variant="neutral" onClick={onClose} disabled={isSending}>
                Cancel
              </Button>
              <Button type="submit" size="s" style="fill" variant="primary" disabled={!canSend}>
                {OPEN_ROLE_SEND_LABEL}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
}
