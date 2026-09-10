'use client';

import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CloseIcon, InfoCircleIconOutlined } from '@/components/icons';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { formatRelativeDays } from '@/utils/jobs.utils';

import { EnvelopeIcon } from './icons';
// Same chrome as the referral dialog — see the note at the top of this folder's
// `OpenRoleModal.module.scss`.
import s from './components/ReferModal/ReferModal.module.scss';
import local from './OpenRoleModal.module.scss';

import type { OpenRole, OpenInterest } from './openRoles';

const NOTE_MAX = 600;

interface OpenRoleFormData {
  note: string;
}

interface OpenRoleModalProps {
  open: boolean;
  openRole: OpenRole;
  teamName: string;
  /** The signal already on record, if there is one — the dialog opens as a
   *  read-back rather than a form. */
  interest?: OpenInterest;
  onClose: () => void;
  onSend: (note: string) => void;
  onWithdraw: () => void;
  /**
   * Opens the profile editor, carrying whatever has been typed here so far.
   *
   * The message comes back up rather than being abandoned: the board stashes it
   * and hands it to `initialNote` when this dialog reopens. Lifting one string
   * is cheaper than the alternatives (a second tab, or a warning that leaving
   * loses your text), and it means the link can be offered without a caveat.
   */
  onEditProfile: (note: string) => void;
  /** What the message box opens holding — a draft handed back after a trip to
   *  the profile editor, and `''` on a fresh open. */
  initialNote?: string;
}

/**
 * The open role's form: what a person says to a team that has no posting for
 * them.
 *
 * **One field.** It was two: a required pick from the team's role categories
 * above the message, on the argument that a speculative application with no
 * direction cannot be routed. Cut. Routing is the product's convenience, and it
 * was buying it by making someone answer *what are you looking for?* twice —
 * once in a taxonomy the team maintains, once in their own words. The words were
 * always the half worth reading, and a select above them made the answer look
 * like the smaller thing.
 *
 * What is left is the only question the profile cannot already answer.
 * Everything a hiring team needs to judge somebody — name, current role,
 * experience, skills, the CV — is on the profile, and the profile goes with the
 * signal; asking for any of it here would be charging someone to retype what
 * their account exists to hold.
 *
 * **And the field is optional.** The press *is* the signal — production's
 * per-role interest is a bare button with nothing to fill in — so Send is live
 * from the moment the dialog opens. The placeholder does the encouraging that a
 * required mark would otherwise do by force.
 *
 * **It is a dialog, not a step in the apply flow.** The three-step drawer exists
 * because a posting has a description to read, a profile to check against it and
 * a letter to write. An open role has no description and no letter — a rail
 * whose first position holds nothing and whose last holds one text box would be
 * drawing a journey to justify a component.
 *
 * **Reopening shows the answer back, not the form.** See `.sent` in the
 * stylesheet: the two questions someone has after sending are *what did I say*
 * and *can I take it back*, and neither is answered by an editable copy.
 */
export function OpenRoleModal(props: OpenRoleModalProps) {
  const { open, openRole, teamName, interest, onClose, onSend, onWithdraw, onEditProfile, initialNote = '' } = props;

  /** Sent in this sitting. The panel is the same either way — the answers, and
   *  the two presses — and only the two lines above it move: a confirmation
   *  ("Interest sent") for the moment it happened, a record ("Your interest in
   *  …", dated) for every visit after. */
  const [justSent, setJustSent] = useState(false);

  const methods = useForm<OpenRoleFormData>({
    defaultValues: { note: initialNote },
    mode: 'onChange',
  });
  const { getValues } = methods;

  /* A fresh form each time the dialog opens, so a half-typed message to a team
     you closed doesn't turn up on another team's card. That is the *mount's*
     job, not an effect's: the board renders this only while a team is open and
     keys it by that team's uid, so both the form default and `justSent` above
     start clean without a line of code here. An effect resetting them would be
     a cascading render doing what `useState` already did.

     `initialNote` is the one exception, and it is not a stored draft: it is the
     same sitting, handed back after a trip to the profile editor that this form
     itself offers. Closing the dialog still throws the message away — the
     referral modal keeps a real draft because its note is long and drafted for
     you, and this is two lines. */

  /* (`useWatch` on the areas select stood here, to wake a Send that was dead
      until something was picked. Both are gone: there is nothing left to pick,
      and Send is live from the first frame — see the note on the component.) */

  const submit = () => {
    onSend(getValues().note.trim());
    setJustSent(true);
  };

  const sentPanel = interest && (
    <>
      {/* Only when there is something to quote. The field is optional, and a
          label reading "What you told them you're looking for" over the sentence
          "You sent this without a message" is a question printed above its own
          absence — it makes a skipped option look like a gap in the record. With
          no message the receipt is the masthead and the two presses, which is
          all that happened. */}
      {interest.note && (
        <div className={local.sent}>
          <div className={local.sentBlock}>
            {/* The label the field carried, in the past tense — so what is
                quoted here is plainly the answer to the question that was asked,
                and not a second thing the dialog now calls it. */}
            <p className={local.sentLabel}>What you told {teamName} you&apos;re looking for</p>
            <p className={local.sentValue}>{interest.note}</p>
          </div>
        </div>
      )}

      <div className={s.actions}>
        {/* Withdraw sits where Cancel sits — it is the leaving action for this
            state, and there is nothing else here to cancel. Bordered rather than
            filled, so the press that ends something is never the loudest thing
            on the card; `Done` keeps the primary slot. */}
        <Button style="border" variant="primary" className={s.actionButton} onClick={onWithdraw}>
          Withdraw interest
        </Button>
        <Button style="fill" variant="primary" className={s.actionButton} onClick={onClose}>
          Done
        </Button>
      </div>
    </>
  );

  /* The row's own line, with the team named — so arriving here is recognised as
     the thing that was pressed. It used to say "Open role at <team>", which is
     what this record is *called in the code* and a phrase the board no longer
     shows anywhere: the row asks a question now, and the dialog it opens should
     not rename it on the way through. The team's blurb under it is the answer. */
  const title = interest
    ? justSent
      ? 'Interest sent'
      : `Your interest in ${teamName}`
    : `Didn't find your role at ${teamName}?`;

  /* Both receipt lines say the same thing the form promised — the team was
     notified, and your profile went with it — because a confirmation that
     rewords the promise is a second promise to keep in agreement. Only the tense
     and the date differ. */
  const desc = interest
    ? justSent
      ? `We've let ${teamName} know, and sent your profile and CV with it.`
      : `Sent ${formatRelativeDays(interest.sentAt)}. ${teamName} has your profile and CV with it.`
    : openRole.blurb;

  return (
    <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false} lockScroll>
      <div className={`${s.modal} ${local.card}`}>
        <Button style="link" variant="neutral" className={s.closeButton} onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </Button>

        {/* Left-aligned in every state, which is where this dialog parts company
            with the referral card it borrows from.

            There, `.headerSent` centres the receipt, and correctly: what follows
            it is one button, so the card is an announcement and centring is what
            announcements are for. This receipt has a body — the message quoted
            back under its label — and centring the masthead over a left-aligned
            column puts two alignment axes an inch apart, which reads as a
            mistake rather than as a choice. One left edge, and the envelope
            stays beside the headline. */}
        <div className={s.header}>
          <div className={s.iconWrapper}>
            <EnvelopeIcon />
          </div>
          <div className={s.headerText}>
            <h2 className={s.title}>{title}</h2>
            <p className={s.desc}>{desc}</p>
          </div>
        </div>

        {interest ? (
          sentPanel
        ) : (
          <FormProvider {...methods}>
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <div className={s.fields}>
                <FormTextArea
                  name="note"
                  label={`Tell ${teamName} what you're looking for`}
                  isOptional
                  placeholder="A couple of lines on what you're after, and why this team."
                  rows={5}
                  maxLength={NOTE_MAX}
                  showCharCount
                />
              </div>

              <p className={`${s.privacyNote} ${local.payloadNote}`}>
                <InfoCircleIconOutlined width={16} height={16} aria-hidden="true" />
                {/* The board's own sentence for this act, from `InterestStrip`
                    and production's `JobInterestBanner` — "We'll notify the team
                    … and share your LabOS profile" — with the CV named, because
                    on this form the profile is the whole of what gets sent and
                    the document is the part nobody would assume. One signal, one
                    promise, wherever it is made. */}
                <span>
                  We&apos;ll notify {teamName} and share your LabOS profile and CV.{' '}
                  {/* The way to check what that is, in the sentence that names
                      it. The profile is the whole of what this press sends —
                      the message is the smaller half — and up to now the form
                      asserted that without offering any way to look at it.

                      Inline, at the end of the clause, rather than as a control
                      of its own: it qualifies a sentence, and a bordered button
                      beside a note would be a second object competing with the
                      footer's own pair. Same reasoning the apply flow's step 3
                      uses for its `Edit profile`, which is also a link and not a
                      button.

                      The typed message survives the trip — the board holds it
                      while the editor is open and hands it back. See
                      `openProfileFromInterest` there. */}
                  <button type="button" className={local.editLink} onClick={() => onEditProfile(getValues().note)}>
                    Edit profile
                  </button>
                </span>
              </p>

              <div className={s.actions}>
                <Button style="border" variant="primary" className={s.actionButton} onClick={onClose}>
                  Cancel
                </Button>
                {/* Never disabled. The press is the signal; the message is what
                    someone adds to it. A Send that stays dead until a text box
                    has something in it would make an optional field required
                    without saying so. */}
                <Button type="submit" style="fill" variant="primary" className={s.actionButton}>
                  Send interest
                </Button>
              </div>
            </form>
          </FormProvider>
        )}
      </div>
    </Modal>
  );
}
