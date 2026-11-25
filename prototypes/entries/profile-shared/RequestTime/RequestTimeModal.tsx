'use client';

import { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CalendarBlankIcon, CloseIcon } from '@/components/icons';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';

// Demo Day's "Make an intro" card, and the intro modal's masthead row on it —
// the same chrome as "Request an intro", so the two requests read as siblings.
import rc from '@/components/page/demo-day/ActiveView/components/TeamsList/components/ReferCompanyModal/ReferCompanyModal.module.scss';
import im from '../../intro-shared/RequestIntroModal.module.scss';

import type { TimeTarget } from './timeRequests';
import s from './RequestTime.module.scss';

const MESSAGE_MAX = 1000;

/**
 * LAB-3400 "Request time with <name>". One required field (R3: "a message
 * field"): what the call is about, which is the one thing the member needs to
 * decide whether to make time. The visitor is a signed-in member, so who they
 * are travels with the request (their profile is linked in the email); no
 * "Introduce yourself" field, unlike the intro, because nobody routes this.
 *
 * The description says the three things the form cannot show (R7): who gets
 * it (Maya, directly — not the PL team), how (email + a notice in LabOS), and
 * that nothing is booked until Maya answers.
 */
export function RequestTimeModal({
  target,
  onClose,
  onSend,
}: {
  target: TimeTarget | null;
  onClose: () => void;
  onSend: (target: TimeTarget, message: string) => void;
}) {
  return (
    <Modal isOpen={!!target} onClose={onClose} closeOnBackdropClick={false} lockScroll>
      {target && <Form key={target.uid} target={target} onClose={onClose} onSend={onSend} />}
    </Modal>
  );
}

function Form({
  target,
  onClose,
  onSend,
}: {
  target: TimeTarget;
  onClose: () => void;
  onSend: (target: TimeTarget, message: string) => void;
}) {
  const methods = useForm<{ message: string }>({ defaultValues: { message: '' } });
  const { handleSubmit, reset, control } = methods;
  const message = useWatch({ control, name: 'message' }) ?? '';
  const first = target.name.split(' ')[0];

  useEffect(() => () => reset(), [reset]);

  return (
    <div className={clsx(rc.modal, im.card)}>
      <button type="button" className={rc.closeButton} onClick={onClose} aria-label="Close">
        <CloseIcon />
      </button>

      <div className={im.header}>
        <div className={clsx(rc.iconWrapper, im.icon)}>
          <CalendarBlankIcon className={s.mastGlyph} aria-hidden="true" />
        </div>
        <div className={im.headerText}>
          <h2 className={clsx(rc.title, im.left)}>Request time with {target.name}</h2>
          <p className={clsx(rc.desc, im.left)}>
            {first} hasn&apos;t set up office hours. We&apos;ll email {first} your note with a link to your profile,
            and {first} gets back to you directly. Nothing is booked until then.
          </p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form
          className={clsx(rc.form, im.form)}
          onSubmit={handleSubmit((data) => onSend(target, data.message.trim()))}
        >
          <div className={im.fields}>
            <FormTextArea
              name="message"
              label="What would you like to talk about?"
              placeholder={`The topic, why ${first}, and roughly when suits you`}
              isRequired
              rows={6}
              maxLength={MESSAGE_MAX}
              showCharCount
            />
          </div>

          <div className={rc.actions}>
            <Button style="border" variant="primary" className={im.action} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              style="fill"
              variant="primary"
              className={im.action}
              disabled={message.trim().length === 0}
            >
              Send request
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
