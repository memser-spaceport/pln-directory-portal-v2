'use client';

import { useId, useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import btn from '@/components/common/Button/Button.module.scss';
import { Checkbox } from '@/components/common/Checkbox';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { InfoCircleIconOutlined, SuccessCircleIcon } from '@/components/icons';

import s from './JobInterestBanner.module.scss';

/**
 * A light signal beside Apply: "let this team know you're interested".
 *
 * Sits between the job masthead and "About the role", which is where the design
 * puts it and — because those sections are siblings in `JobDetailPane`'s
 * fragment — the only place it can go without taking the column's 16px gap away
 * from its neighbours.
 *
 * **Three states drawn as three components, rendered as one.** The design has a
 * blue-tinted card with a 128x40 outlined button, the same card opened into a
 * short note composer (LAB-2713), and a green success alert with an underlined
 * "Undo" link. They swap surface, icon, title and action — but the action stays
 * one `<button>` element that changes its classes and its label, never two that
 * replace each other.
 *
 * That is not a shortcut, it is the accessibility fix: unmounting the pressed
 * control drops focus to `<body>`, so a keyboard user loses their place in a
 * thousand-pixel description and a screen-reader user hears nothing at all.
 * Keeping the node means focus survives the toggle for free and the new label is
 * announced because it is the focused element. Do not "clean this up" into
 * conditional buttons.
 *
 * **The note (LAB-2713).** The press used to send a bare signal, while the
 * team's Candidates page read as if a message came with it. Now the press opens
 * the card into a composer in the same slot — one optional field, Cancel and
 * Send — so the signal is still one decision, and sending with the field empty
 * sends exactly what the old press did. Opened in place rather than in a modal:
 * it is a sentence added to a tap, not a second act. The confirmation quotes
 * the note back when there is one and says nothing about it when there is not.
 *
 * The text block is an `aria-live` region so the title change is heard by
 * someone who pressed with the mouse and is not focused here.
 *
 * **The title is a `<p>`, not a heading.** The review step already has one `<h1>`
 * (the role). A second heading here would put another "what this role wants from
 * you" landmark in a document that gains nothing from it.
 *
 * Auth is not this component's business: the press is handed up, and the drawer
 * decides whether it means a mutation or a trip to Privy, the same way it
 * decides every other auth-dependent affordance in this flow. It takes no
 * `isLoggedIn` — a signed-out visitor is never wired this banner at all
 * (`canShowJobInterest`), so the two-sentence split this used to carry was
 * describing a state production cannot reach.
 */

export const INTEREST_CTA_LABEL = "I'm interested";
export const INTEREST_UNDO_LABEL = 'Undo';
export const INTEREST_SEND_LABEL = 'Send interest';
export const INTEREST_CANCEL_LABEL = 'Cancel';

/**
 * The note's limit, counted after trimming — the number the server rejects
 * above (LAB-2726). A validation target, NOT a `maxLength` attribute: that
 * silently truncates pasted text, so the count goes red and the send is held
 * instead (the cover letter's own rule, `COVER_LETTER_MAX_LENGTH`).
 */
export const INTEREST_NOTE_MAX_LENGTH = 280;

export const interestNoteLabel = (teamName: string) => `Add a note for ${teamName}`;
export const INTEREST_NOTE_PLACEHOLDER = "What draws you to this role, or anything your profile doesn't say";
export const interestNoteOverLimit = (over: number) =>
  `Your note is ${over} characters over the ${INTEREST_NOTE_MAX_LENGTH} character limit.`;
export const interestNoteSentLabel = (teamName: string) => `Your note to ${teamName}`;

/**
 * What pressing this actually does, in words — and the constraint on changing
 * them. **LAB-2596 owns the wording; this rule owns the claim.**
 *
 * **No sentence here may name a recipient or a delivery event.** Marking
 * interest writes one `JobOpeningInterest` row (backend
 * `job-openings-interest.service.ts`) and does nothing else: no email, no
 * notification, no push, no ATS. The strings below may describe a record being
 * kept, its scope (this role), and that Undo removes it. That is the whole set
 * of true things. (The note is read by the team's hiring leads on their
 * Candidates page, which is a read of the record, not a delivery.)
 *
 * These used to say *"We'll notify the team if you're a match"* and *"The team
 * will see it if you're a match"*, which is the false promise LAB-2573 was
 * opened to remove. Its own suggested replacements — interest going "directly
 * to the ATS" for Protocol Labs, teams seeing interested members "on their
 * Hiring tab" — name two more recipients that do not exist either, so they are
 * not here.
 *
 * **Do not reword these back toward a promise when the feature seems to grow
 * one.** If interest is to reach a team, that becomes true in the flow first,
 * and these sentences follow it. Compare `JobUnlock/unlockCopy.ts`, whose copy
 * is design-owned for the opposite reason and carries the opposite instruction.
 */
export const INTEREST_SUBTITLE = "We'll note your interest in this role. You can undo it any time.";
export const INTEREST_CONFIRMED_TITLE = 'Your interest is recorded';

/* Left as it was, and raised on LAB-2596 rather than reworded here: "let them
   know" is also a delivery claim by the rule above, but it is the banner's ask
   and its whole reason for existing, so replacing it is the design's call and
   not a local correctness fix. */
export const interestPromptTitle = (teamName: string) => `Let ${teamName} know you're interested`;

/** The follow offer carried beside the press that sends something to a team —
 *  this banner's row and the apply footer's tick share one sentence. */
export const teamFollowOfferLabel = (teamName: string) => `Follow ${teamName} to hear when they post or hire`;

interface JobInterestBannerProps {
  teamName: string;
  isInterested: boolean;
  /** The note that went with the signal, quoted back under the confirmation.
   *  Absent or null when none did. */
  note?: string | null;
  /** The server's own message when the last toggle failed. Replaces the subtitle. */
  error: string | null;
  /**
   * The follow offer, drawn under the subtitle while the signal is still to be
   * sent. Absent when the viewer already follows the team — there is nothing
   * left to offer — and once the signal is in, because the footer of that
   * state is Undo and there is no press for the tick to ride.
   */
  follow?: {
    checked: boolean;
    onChange: (next: boolean) => void;
  };
  /** `followTeam` is the follow row's tick at press time: true when marking
   *  interest should also follow the team. Meaningless on Undo.
   *  `followOffered` is whether the tick was on screen for this press.
   *  `note` is what was typed, trimmed; '' when nothing was (and on Undo). */
  onToggle: (nextInterested: boolean, followTeam: boolean, followOffered: boolean, note: string) => void;
}

type NoteForm = { note: string };

export function JobInterestBanner(props: JobInterestBannerProps) {
  const { teamName, isInterested, note, error, follow, onToggle } = props;

  /* Whether the card is open on its composer. Derived against `isInterested`
     rather than reset by an effect: once the signal is in, the confirmation
     wins whatever this says, and if the server then refuses (the optimistic
     flip reverts) the box is still open with the words in it, which is the
     one thing a failed send must not lose. */
  const [composing, setComposing] = useState(false);
  const showComposer = composing && !isInterested;

  /* One field, but through react-hook-form all the same: `FormTextArea` is the
     app's textarea and reads its context, and the cover letter next door is
     built the same way. The id keeps two banners on one page (the board's
     drawer and the team profile's) from sharing a textarea name. */
  const fieldName = `interestNote-${useId()}`;
  const methods = useForm<Record<string, string>>({ defaultValues: { [fieldName]: '' } });
  const typed = useWatch({ control: methods.control, name: fieldName }) ?? '';
  const remaining = INTEREST_NOTE_MAX_LENGTH - typed.trim().length;
  const overLimit = remaining < 0;

  const title = isInterested ? INTEREST_CONFIRMED_TITLE : interestPromptTitle(teamName);
  const sentNote = isInterested && note ? note : null;

  const closeComposer = () => {
    methods.reset({ [fieldName]: '' });
    setComposing(false);
  };

  const handleAction = () => {
    if (isInterested) {
      /* Undo then mark again starts from an empty box: the old note is gone
         with the signal (LAB-2726), so nothing here should remember it either. */
      closeComposer();
      onToggle(false, false, false, '');
      return;
    }
    if (!showComposer) {
      setComposing(true);
      return;
    }
    if (overLimit) return;
    onToggle(true, follow?.checked ?? false, Boolean(follow), typed.trim());
  };

  const actionLabel = isInterested ? INTEREST_UNDO_LABEL : showComposer ? INTEREST_SEND_LABEL : INTEREST_CTA_LABEL;

  return (
    <div className={clsx(s.root, isInterested && s.confirmed, showComposer && s.composing)}>
      <div className={s.lead}>
        <span className={s.iconTile} aria-hidden="true">
          {isInterested ? (
            <SuccessCircleIcon width={24} height={24} />
          ) : (
            <InfoCircleIconOutlined width={20} height={20} />
          )}
        </span>

        <div className={s.text} aria-live="polite">
          <p className={s.title}>{title}</p>
          {/* One slot, three things it can say: the offer, the correction, or —
              once the signal is in — nothing, because the title is the whole
              message and a subtitle under it would be padding. */}
          {error ? (
            <p className={s.error}>{error}</p>
          ) : (
            !isInterested && <p className={s.subtitle}>{INTEREST_SUBTITLE}</p>
          )}
          {!isInterested && follow && (
            <label className={s.follow}>
              <Checkbox checked={follow.checked} onChange={follow.onChange} />
              <span>{teamFollowOfferLabel(teamName)}</span>
            </label>
          )}
          {/* The note, quoted back — the person's own words, so it sits on
              white under the alert's voice rather than in it. */}
          {sentNote && (
            <div className={s.sentNote}>
              <p className={s.sentLabel}>{interestNoteSentLabel(teamName)}</p>
              <p className={s.sentValue}>{sentNote}</p>
            </div>
          )}
        </div>
      </div>

      {showComposer && (
        <FormProvider {...methods}>
          <div className={s.composer}>
            <FormTextArea
              name={fieldName}
              label={interestNoteLabel(teamName)}
              isOptional
              placeholder={INTEREST_NOTE_PLACEHOLDER}
              rows={3}
            />
            {/* `120 / 280`, `FormTextArea`'s own counter format, hand-rolled for
                the reason the cover letter gives: the built-in one needs a
                real `maxLength`, and that attribute truncates a paste. */}
            <p className={clsx(s.counter, overLimit && s.counterOver)} aria-hidden="true">
              {typed.length} / {INTEREST_NOTE_MAX_LENGTH}
            </p>
            <p className={s.visuallyHidden} role="status">
              {overLimit ? interestNoteOverLimit(-remaining) : ''}
            </p>
          </div>
        </FormProvider>
      )}

      <div className={s.actions}>
        {showComposer && (
          <button
            type="button"
            onClick={closeComposer}
            className={clsx(s.cancel, btn.root, btn.medium, btn.border, btn.neutral)}
          >
            {INTEREST_CANCEL_LABEL}
          </button>
        )}
        <button
          type="button"
          onClick={handleAction}
          disabled={showComposer && overLimit}
          className={clsx(
            s.action,
            isInterested
              ? clsx(btn.root, btn.small, btn.link, btn.success, btn.underline)
              : showComposer
                ? clsx(btn.root, btn.medium, btn.fill, btn.primary)
                : clsx(btn.root, btn.medium, btn.border, btn.primary),
          )}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
