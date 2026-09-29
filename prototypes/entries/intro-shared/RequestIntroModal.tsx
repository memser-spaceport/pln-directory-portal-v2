'use client';

import { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';

// Demo Day's "Make an intro" modal, imported: card, close disc, envelope disc,
// title and description type, form gap, footer row.
import rc from '@/components/page/demo-day/ActiveView/components/TeamsList/components/ReferCompanyModal/ReferCompanyModal.module.scss';

import { EnvelopeGlyph } from './EnvelopeGlyph';
import type { IntroTarget } from './introRequests';
import s from './RequestIntroModal.module.scss';

// The Demo Day form's own cap on a message.
const MESSAGE_MAX = 1000;
// "Introduce yourself" is a few lines about who is asking, not a letter.
const INTRO_MAX = 500;

export interface IntroRequestFields {
  message: string;
  intro: string;
}

interface Props {
  target: IntroTarget | null;
  onClose: () => void;
  onSend: (target: IntroTarget, fields: IntroRequestFields) => void;
}

/**
 * "Request an intro" — the Demo Day "Make an intro" modal, pointed at the PL
 * team.
 *
 * Same card (`ReferCompanyModal.module.scss`), two fields: the person or team
 * is already known, so the modal asks who you are and why. The masthead is
 * the job board's reading of that chrome — envelope beside the headline, title
 * and sentence left-aligned as the column to its right — because this is a
 * form and a form has one left edge (see `job-board/components/ReferModal`).
 *
 * Two variants, one form:
 * - member — the intro is to this person; the PL team makes it.
 * - team   — the requester (a founder, an operator, a BD person) does not
 *   know who on the team to ask, so the PL team routes it: a founder, an
 *   events lead, whoever fits. The "why" field's placeholder invites naming a
 *   person or a role, since that is the routing input.
 *
 * "Introduce yourself" (added 2026-09-28, above Why) is OPTIONAL. The
 * requester is a signed-in member, so the PL team already has their profile;
 * the field is for the framing a profile cannot give ("I run BD at X, we're
 * building Y"). Making it required would put a second gate on a request whose
 * one real input is the why — Send still waits only on that.
 *
 * The description says the two things the form cannot show: where the
 * request goes, and that nobody on the other side is contacted until the PL
 * team makes the intro — at which point they read what you wrote. Said once
 * there rather than as a "Shared with…" caption under each field.
 */
export function RequestIntroModal({ target, onClose, onSend }: Props) {
  return (
    <Modal isOpen={!!target} onClose={onClose} closeOnBackdropClick={false} lockScroll>
      {target && <RequestForm key={target.uid} target={target} onClose={onClose} onSend={onSend} />}
    </Modal>
  );
}

function RequestForm({ target, onClose, onSend }: { target: IntroTarget } & Omit<Props, 'target'>) {
  const methods = useForm<IntroRequestFields>({ defaultValues: { intro: '', message: '' } });
  const { handleSubmit, reset, control } = methods;
  const message = useWatch({ control, name: 'message' }) ?? '';
  const canSend = message.trim().length > 0;
  const isTeam = target.kind === 'team';
  const first = isTeam ? target.name : target.name.split(' ')[0];

  useEffect(() => () => reset(), [reset]);

  const description = isTeam
    ? `The PL team picks the right person at ${target.name} — a founder, a BD or events lead, whoever fits — and makes the intro. They see what you write here only then.`
    : `Your request goes to the PL team, who makes the intro. ${first} isn’t contacted until then, and sees what you write here only then.`;

  return (
    <div className={clsx(rc.modal, s.card)}>
      <button type="button" className={rc.closeButton} onClick={onClose} aria-label="Close">
        <CloseIcon />
      </button>

      <div className={s.header}>
        <div className={clsx(rc.iconWrapper, s.icon)}>
          <EnvelopeGlyph size={32} />
        </div>
        <div className={s.headerText}>
          <h2 className={clsx(rc.title, s.left)}>Request an intro to {target.name}</h2>
          <p className={clsx(rc.desc, s.left)}>{description}</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form
          className={clsx(rc.form, s.form)}
          onSubmit={handleSubmit((data) => onSend(target, { message: data.message.trim(), intro: data.intro.trim() }))}
        >
          <div className={s.fields}>
            <FormTextArea
              name="intro"
              label="Introduce yourself"
              placeholder="Your role, your team, and what you’re working on"
              isOptional
              rows={4}
              maxLength={INTRO_MAX}
              showCharCount
            />
            <FormTextArea
              name="message"
              label="Why would you like an intro?"
              placeholder={
                isTeam
                  ? 'Who or what role you’d like to reach, and what you’d like to talk about'
                  : 'What you’d like to talk about with ' + first
              }
              isRequired
              rows={6}
              maxLength={MESSAGE_MAX}
              showCharCount
            />
          </div>

          <div className={rc.actions}>
            <Button style="border" variant="primary" className={s.action} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" style="fill" variant="primary" className={s.action} disabled={!canSend}>
              Send request
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
