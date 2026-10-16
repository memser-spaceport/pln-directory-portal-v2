'use client';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
import { CONTACT_MESSAGE_MAX_LENGTH } from '@/schema/suggested-candidates';

import s from './ContactSuggestedModal.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** The suggested member's full name. */
  personName: string;
  roleTitle: string;
  teamName: string;
  /** The role's public posting page; the subtitle links the role to it when set. */
  postingHref?: string | null;
  /** The signed-in lead, as the template introduces them. Either may be missing while their profile loads. */
  senderName?: string | null;
  /** The lead's role on this team, e.g. "Head of Engineering". */
  senderRole?: string | null;
  /** The lead's text so far, held by the host per role and person; undefined until they type. */
  draft: string | undefined;
  onDraftChange: (text: string) => void;
  isSending: boolean;
  /** The host sends, closes on success (and on 409), and toasts on any other failure. */
  onSend: (message: string) => void;
}

const firstNameOf = (name: string | null | undefined) => name?.trim().split(/\s+/)[0] ?? '';

/**
 * The prefill (LAB-2853, from the design review of 2026-10-13). It says once
 * that the person did not apply and why they came up, makes one ask, and makes
 * a "no" cost one line. "Our <role> role" reads right for any title. There is
 * no "why you" sentence: the helper above the box asks the lead to add their
 * own.
 *
 * The lead's name and role fill in when known. Without them the introduction
 * shortens rather than printing a blank. The member's email has a "View the
 * role" button under the message, so "linked below" is true.
 */
export const contactTemplate = ({
  firstName,
  roleTitle,
  teamName,
  senderName,
  senderRole,
}: {
  firstName: string;
  roleTitle: string;
  teamName: string;
  senderName?: string | null;
  senderRole?: string | null;
}) => {
  const senderFirst = firstNameOf(senderName);
  const team = teamName || 'our team';
  const role = senderRole?.trim();
  const intro = senderFirst
    ? `I'm ${senderFirst}${role ? `, ${role} at ${team}` : ` from ${team}`}.`
    : `I lead hiring at ${team}.`;
  const hiring = roleTitle ? `I'm hiring for our ${roleTitle} role.` : "I'm hiring for one of our roles.";

  return [
    `Hi ${firstName},`,
    `${intro} ${hiring} You didn't apply; your profile came up as a match for it on the Protocol Labs network.`,
    "If the role sounds worth a look, would you be open to a 20-minute call in the next couple of weeks? The posting is linked below. If the timing or the role isn't right, a one-line no is completely fine.",
    senderFirst ? `Thanks,\n${senderFirst}` : 'Thanks',
  ].join('\n\n');
};

/**
 * Contact a suggested member (LAB-2847): one message, sent through the
 * platform.
 *
 * One field and nothing else — no subject, no sender card, no reset. The member
 * gets it by email from the PL Network with a link to the role, and a reply
 * reaches the lead's own email. Up to 2000 characters, the endpoint's limit.
 *
 * The subtitle's role links to the public posting, so the lead can check what
 * the member will open (LAB-2853).
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
  postingHref,
  senderName,
  senderRole,
  draft,
  onDraftChange,
  isSending,
  onSend,
}: Props) {
  const firstName = firstNameOf(personName) || personName;
  const text = draft ?? contactTemplate({ firstName, roleTitle, teamName, senderName, senderRole });
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
              About{' '}
              {roleTitle && postingHref ? (
                <a className={s.roleLink} href={postingHref} target="_blank" rel="noopener noreferrer">
                  {roleTitle}
                  <ArrowUpRightIcon width={12} height={12} />
                </a>
              ) : (
                roleTitle || 'this role'
              )}
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
          <p id="contact-suggested-helper" className={s.helper}>
            Say what caught your eye in {firstName}’s profile
          </p>
          <textarea
            id="contact-suggested-message"
            className={s.field}
            rows={12}
            maxLength={CONTACT_MESSAGE_MAX_LENGTH}
            value={text}
            onChange={(e) => onDraftChange(e.target.value)}
            aria-describedby="contact-suggested-helper contact-suggested-count"
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
            {/* "Send", not "Send email" (LAB-2837 feedback): the line above the
                field already says it goes by email. */}
            {isSending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
