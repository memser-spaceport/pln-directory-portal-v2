'use client';

import { useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CloseIcon, InfoCircleIconOutlined } from '@/components/icons';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import type { MultiSelectOption } from '@/components/form/FormMultiSelect';
import { formatRelativeDays } from '@/utils/jobs.utils';

import { PreferenceMultiSelect } from './PreferenceMultiSelect';
import { EnvelopeIcon } from './icons';
// Same chrome as the referral dialog — see the note at the top of this folder's
// `OpenRoleModal.module.scss`.
import s from './components/ReferModal/ReferModal.module.scss';
import local from './OpenRoleModal.module.scss';

import type { OpenRole, OpenInterest } from './openRoles';

const NOTE_MAX = 600;

interface OpenRoleFormData {
  areas: MultiSelectOption[];
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
  onSend: (areas: string[], note: string) => void;
  onWithdraw: () => void;
}

/**
 * The open role's form: what a person says to a team that has no posting for
 * them.
 *
 * **Two fields, and each had to survive "does something already ask this?"**
 * Everything a hiring team needs to judge somebody — name, current role,
 * experience, skills, the CV — is on the profile, and the profile goes with the
 * signal. Asking any of it again would be charging someone to retype what their
 * account exists to hold. What the profile cannot say is *which of this team's
 * doors* to knock on, and *why this team*. That is the whole form.
 *
 *  - **Area** — picked from the team's own list, so the signal routes. Required,
 *    because a speculative application with no direction is a profile with no
 *    question attached, and nobody can act on it.
 *  - **Note** — optional. It is the part that makes a general application worth
 *    reading, but a person who has nothing to add should not be blocked from
 *    raising their hand; the placeholder does the encouraging instead of a gate.
 *
 * **It is a dialog, not a step in the apply flow.** The three-step drawer exists
 * because a posting has a description to read, a profile to check against it and
 * a letter to write. An open role has no description and no letter — a rail
 * whose first position holds nothing and whose last holds two fields would be
 * drawing a journey to justify a component.
 *
 * **Reopening shows the answers back, not the form.** See `.sent` in the
 * stylesheet: the two questions someone has after sending are *what did I say*
 * and *can I take it back*, and neither is answered by an editable copy.
 */
export function OpenRoleModal(props: OpenRoleModalProps) {
  const { open, openRole, teamName, interest, onClose, onSend, onWithdraw } = props;

  /** Sent in this sitting. The panel is the same either way — the answers, and
   *  the two presses — and only the two lines above it move: a confirmation
   *  ("Interest sent") for the moment it happened, a record ("Your interest in
   *  …", dated) for every visit after. */
  const [justSent, setJustSent] = useState(false);

  const methods = useForm<OpenRoleFormData>({
    defaultValues: { areas: [], note: '' },
    mode: 'onChange',
  });
  const { control, getValues } = methods;
  /* `useWatch`, not `getValues`: the footer's Send has to wake up the moment an
     area is picked, and `getValues` does not re-render. */
  const areas = useWatch({ control, name: 'areas' }) ?? [];

  /* A fresh form each time the dialog opens, so a half-typed note from a team
     you closed doesn't turn up on another team's card. That is the *mount's*
     job, not an effect's: the board renders this only while a team is open and
     keys it by that team's uid, so both the form defaults and `justSent` above
     start clean without a line of code here. An effect resetting them would be
     a cascading render doing what `useState` already did.
     Deliberately not a draft, either: the referral modal keeps one because its
     note is drafted for you and long, and this is two lines you would rather
     retype than find waiting. */

  const areaOptions: MultiSelectOption[] = useMemo(
    () => openRole.areas.map((a) => ({ label: a, value: a })),
    [openRole.areas],
  );

  /* Portalled to the body: `.fields` is the card's scroll region, so a menu
     rendered inside it is clipped at the fold. Read at render rather than at
     module scope because this folder's rules forbid touching `document` where
     the server could reach it — the board mounts client-side only, and this
     dialog only exists once someone has pressed something. */
  const menuPortalTarget = typeof document === 'undefined' ? null : document.body;

  const canSend = areas.length > 0;

  const submit = () => {
    if (!canSend) return;
    const values = getValues();
    onSend(
      values.areas.map((a) => String(a.value)),
      values.note.trim(),
    );
    setJustSent(true);
  };

  const sentPanel = interest && (
    <>
      <div className={local.sent}>
        <div className={local.sentBlock}>
          <p className={local.sentLabel}>What you&apos;re looking for</p>
          <p className={local.sentValue}>{interest.areas.join(', ')}</p>
        </div>
        <div className={local.sentBlock}>
          <p className={local.sentLabel}>Your note</p>
          <p className={`${local.sentValue} ${interest.note ? '' : local.sentEmpty}`}>
            {interest.note || 'You sent this without a note.'}
          </p>
        </div>
      </div>

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

  const title = interest ? (justSent ? 'Interest sent' : `Your interest in ${teamName}`) : `Open role at ${teamName}`;

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
            announcements are for. This receipt has a body — the two answers,
            each under its own label — and centring the masthead over a
            left-aligned column puts two alignment axes an inch apart, which
            reads as a mistake rather than as a choice. One left edge, and the
            envelope stays beside the headline. */}
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
                <PreferenceMultiSelect
                  name="areas"
                  label="What kind of role are you looking for?"
                  placeholder="Pick one or more"
                  options={areaOptions}
                  menuPortalTarget={menuPortalTarget}
                />

                <FormTextArea
                  name="note"
                  label={`Anything you'd like ${teamName} to know?`}
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
                <span>We&apos;ll notify {teamName} and share your LabOS profile and CV.</span>
              </p>

              <div className={s.actions}>
                <Button style="border" variant="primary" className={s.actionButton} onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" style="fill" variant="primary" className={s.actionButton} disabled={!canSend}>
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
