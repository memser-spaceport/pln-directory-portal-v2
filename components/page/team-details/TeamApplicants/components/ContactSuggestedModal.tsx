'use client';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { CONTACT_MESSAGE_MAX_LENGTH } from '@/schema/suggested-candidates';

import s from './ContactSuggestedModal.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** The suggested member's full name. */
  personName: string;
  roleTitle: string;
  teamName: string;
  /** The lead's text so far, held by the host per role and person; undefined until they type. */
  draft: string | undefined;
  onDraftChange: (text: string) => void;
  isSending: boolean;
  /** The host sends, closes on success (and on 409), and toasts on any other failure. */
  onSend: (message: string) => void;
}

/** The prefill. Copy may change in design review; behaviour does not. */
export const contactTemplate = ({
  firstName,
  roleTitle,
  teamName,
}: {
  firstName: string;
  roleTitle: string;
  teamName: string;
}) =>
  `Hi ${firstName}, I lead hiring for ${roleTitle || 'a role'} at ${teamName || 'our team'}. Your profile looks like a good fit, and I'd like to tell you more about the role. Would you be open to a short chat?`;

/**
 * Contact a suggested member (LAB-2847): one message, sent through the
 * platform.
 *
 * One field and nothing else — no subject, no sender card, no reset. The member
 * gets it by email from the PL Network with a link to the role, and a reply
 * reaches the lead's own email. Up to 2000 characters, the endpoint's limit.
 *
 * **The text lives in the host**, per role and person, so closing the modal or
 * a failed send never costs what the lead wrote; the modal only renders it.
 */
export function ContactSuggestedModal({
  isOpen,
  onClose,
  personName,
  roleTitle,
  teamName,
  draft,
  onDraftChange,
  isSending,
  onSend,
}: Props) {
  const firstName = personName.split(' ')[0] || personName;
  const text = draft ?? contactTemplate({ firstName, roleTitle, teamName });
  const tooLong = text.length > CONTACT_MESSAGE_MAX_LENGTH;
  const canSend = text.trim().length > 0 && !tooLong && !isSending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabelledBy="contact-suggested-title" lockScroll inertBackground>
      <div className={s.root}>
        <div className={s.header}>
          <div className={s.headerText}>
            <h2 id="contact-suggested-title" className={s.title}>
              Contact {firstName}
            </h2>
            <p className={s.subtitle}>
              About {roleTitle || 'this role'}
              {teamName ? ` at ${teamName}` : ''}
            </p>
          </div>
          <button type="button" className={s.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>

        <div className={s.content}>
          <p className={s.lede}>
            {firstName} gets this by email from the PL Network, with a link to the role. Replies go to your email.
          </p>
          <label className={s.label} htmlFor="contact-suggested-message">
            Message
          </label>
          <textarea
            id="contact-suggested-message"
            className={s.field}
            rows={8}
            maxLength={CONTACT_MESSAGE_MAX_LENGTH}
            value={text}
            onChange={(e) => onDraftChange(e.target.value)}
            aria-describedby="contact-suggested-count"
            aria-invalid={tooLong || undefined}
          />
          <p id="contact-suggested-count" className={tooLong ? s.countOver : s.count}>
            {text.length} / {CONTACT_MESSAGE_MAX_LENGTH}
          </p>
        </div>

        <div className={s.footer}>
          <Button style="border" variant="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSend} onClick={() => onSend(text.trim())}>
            {isSending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
