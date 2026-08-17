'use client';

// The confirm-and-compose step behind the table's envelope button.
//
// WHAT IT REPLACES
// The back-office app fires the invite on click and shows a plain confirm sheet:
// a grey Name/Email card, four bullets describing the email, an amber "invited
// before" note, Cancel / Resend. All of that survives here — it is the only place
// an admin gets told what the recipient will actually receive.
//
// WHAT CHANGED, AND WHY
//  - The email is editable. Once you can change the wording, the four bullets
//    split in two: the subject and body become fields (a draft, not a fait
//    accompli), and the parts the *send* adds — branding, the pre-filled sign-in
//    link, the support contact, the delivery channel — stay a list, because no
//    amount of typing changes them. See `inviteTemplate.ts`.
//  - Template vars stop being an opaque JSON cell. The modal names what got
//    filled in from this row, and says which line was dropped when a var is
//    missing, which is most rows.
//
// WHAT THIS MODAL IS *NOT*, SINCE THE OVERVIEW CARD ARRIVED
// It edits one send. The wording everyone gets is the spotlight's template
// (Overview → Email Template), which arrives here as `template` and seeds the
// draft. Nothing typed below is written back to it — "Reset to template" means
// "back to the spotlight's template", not "back to the shipped default".
//
// REUSE MAP (prototypes/CLAUDE.md #2)
//  - Modal, Button, CloseIcon, FormField, FormTextArea — production components.
//  - Chrome (24px card, centred envelope/title/desc, scrolling field stack, twin
//    full-width footer) is the job-board ReferModal's, which is itself Demo Day's
//    "Make an intro" modal. Transcribed into the stylesheet, not imported: that
//    file lives in another prototype entry.
//  - The 32px envelope is that modal's glyph, copied for the same reason.
//
// Deliberately dropped: this sends nothing, so there is no pending state and no
// sent state — the parent closes the modal and writes the status line, exactly as
// the immediate-fire version did.

import { useMemo } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';

import type { InviteContext, SpotlightParticipant } from './mocks';
import type { InviteTemplate } from './inviteTemplate';
import { SEND_FOOTNOTE, buildInviteDraft } from './inviteTemplate';
import { LargeEnvelopeIcon } from './SpotlightIcons';

import s from './InviteEmailModal.module.scss';

/** Matches the backend cap the referral flow uses; long enough never to bite here. */
const BODY_MAX_LENGTH = 5000;

interface InviteEmailModalProps {
  open: boolean;
  /** Null only before the first open — it survives close, so the card can fade out. */
  row: SpotlightParticipant | null;
  /** The spotlight's template, as last saved in Overview → Email Template. */
  template: InviteTemplate;
  /** Live Overview values, so a renamed spotlight renames the subject line. */
  context: InviteContext;
  /**
   * Changes on every open. It keys the card, so each open mounts a fresh form
   * seeded straight from the draft — no reset effect, and therefore no window in
   * which an empty field reads as "edited" and flashes "Reset to template".
   */
  session: string;
  onClose: () => void;
  onSend: (row: SpotlightParticipant, email: { subject: string; body: string; edited: boolean }) => void;
}

type InviteFormData = { subject: string; body: string };

export default function InviteEmailModal({
  open,
  row,
  template,
  context,
  session,
  onClose,
  onSend,
}: InviteEmailModalProps) {
  return (
    <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false} lockScroll>
      {row ? (
        <InviteEmailCard
          key={session}
          row={row}
          template={template}
          context={context}
          onClose={onClose}
          onSend={onSend}
        />
      ) : null}
    </Modal>
  );
}

function InviteEmailCard({
  row,
  template,
  context,
  onClose,
  onSend,
}: Omit<InviteEmailModalProps, 'open' | 'session'> & { row: SpotlightParticipant }) {
  const draft = useMemo(() => buildInviteDraft(row, template, context), [row, template, context]);

  // Seeded at mount, and the card is re-mounted per open — so the form is never
  // in a half-filled state, and `edited` can simply be derived rather than
  // tracked. "Reset to template" writes the draft back and the flag clears itself.
  const methods = useForm<InviteFormData>({
    defaultValues: { subject: draft.subject, body: draft.body },
    mode: 'onChange',
  });
  const { control, setValue } = methods;

  const subject = useWatch({ control, name: 'subject' });
  const body = useWatch({ control, name: 'body' });

  const edited = subject !== draft.subject || body !== draft.body;

  const resetTemplate = () => {
    setValue('subject', draft.subject);
    setValue('body', draft.body);
  };

  const resendMode = row.inviteSent;
  const canSend = Boolean(subject?.trim() && body?.trim());
  const fromRow = Object.keys(draft.fromRow);

  const handleSend = () => {
    if (!canSend) return;
    onSend(row, { subject: subject.trim(), body: body.trim(), edited });
  };

  return (
    <div className={s.modal}>
      <Button style="link" variant="neutral" className={s.closeButton} onClick={onClose} aria-label="Close modal">
        <CloseIcon />
      </Button>

      <div className={s.iconWrapper}>
        <LargeEnvelopeIcon />
      </div>

      <h2 className={s.title}>{resendMode ? 'Resend investor invite' : 'Send investor invite'}</h2>

      <p className={s.desc}>
        {resendMode ? 'Resend' : 'Send'} the {context.companyName} spotlight invitation to this participant. Edit the
        email before it goes.
      </p>

      <FormProvider {...methods}>
        <form
          className={s.form}
          onSubmit={(event) => {
            event.preventDefault();
            handleSend();
          }}
        >
          <div className={s.fields}>
            {/* The screenshot's grey identity card. It is the one thing in this
                modal that cannot be edited or mistaken, so it leads. */}
            <div className={s.recipient}>
              <div className={s.recipientRow}>
                <span className={s.recipientLabel}>Name</span>
                <span className={s.recipientValue}>{row.name}</span>
              </div>
              <div className={s.recipientRow}>
                <span className={s.recipientLabel}>Email</span>
                <span className={s.recipientValue}>{row.email}</span>
              </div>
            </div>

            <FormField name="subject" label="Subject" placeholder="Subject line" maxLength={140} />

            <div className={s.bodyBlock}>
              <div className={s.bodyLabelRow}>
                <span className={s.bodyLabel}>Email body</span>
                {edited && (
                  <button type="button" className={s.resetLink} onClick={resetTemplate}>
                    Reset to template
                  </button>
                )}
              </div>
              {/* 7 — the largest that keeps the whole card inside its 860px cap
                  on a laptop screen. Taller and `.fields` starts scrolling, which
                  clips the footnotes mid-line and reads as broken text rather
                  than as content below the fold. The draft runs longer than 7
                  rows either way, so the field scrolls on its own — the ordinary
                  way a textarea holds a long email, and its half-cut last line is
                  the cue that there is more. */}
              <FormTextArea
                name="body"
                placeholder="Write the invite…"
                rows={7}
                maxLength={BODY_MAX_LENGTH}
                showCharCount
              />
            </div>

            {/* Footnotes about the send, in the order an admin would ask: what
                the Template vars cell resolved to, what got left out for want of
                one, and what the send adds by itself. The first two only appear
                when there is something to say. */}
            <div className={s.notes}>
              {fromRow.length > 0 && (
                <p className={s.noteLine}>
                  From this row’s template vars:{' '}
                  {fromRow.map((key, index) => (
                    <span key={key}>
                      {index > 0 && ', '}
                      <code className={s.varToken}>{`{{${key}}}`}</code> → {draft.fromRow[key]}
                    </span>
                  ))}
                </p>
              )}
              {draft.missing.length > 0 && (
                <p className={s.noteLine}>
                  No {draft.missing.map((key) => key.replace(/_/g, ' ')).join(', ')} on this row — the line using it was
                  left out rather than sent half-empty.
                </p>
              )}
              <p className={s.noteLine}>{SEND_FOOTNOTE}</p>
            </div>
          </div>

          {resendMode && (
            <p className={s.warning}>
              This investor has been invited before. They will get a second email — the one written above, not a copy of
              the first.
            </p>
          )}

          <div className={s.actions}>
            <Button style="border" variant="primary" className={s.actionButton} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" style="fill" variant="primary" className={s.actionButton} disabled={!canSend}>
              {resendMode ? 'Resend' : 'Send invite'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
