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

interface Props {
  target: IntroTarget | null;
  onClose: () => void;
  onSend: (target: IntroTarget, message: string) => void;
}

/**
 * "Request an intro" — the Demo Day "Make an intro" modal, pointed at the PL
 * team.
 *
 * Same card (`ReferCompanyModal.module.scss`), one field instead of three: the
 * person or team is already known, so the modal asks only why. The masthead is
 * the job board's reading of that chrome — envelope beside the headline, title
 * and sentence left-aligned as the column to its right — because this is a
 * form and a form has one left edge (see `job-board/components/ReferModal`).
 *
 * The description says the two things the form cannot show: where the request
 * goes, and that the person is not contacted by it.
 */
export function RequestIntroModal({ target, onClose, onSend }: Props) {
  return (
    <Modal isOpen={!!target} onClose={onClose} closeOnBackdropClick={false} lockScroll>
      {target && <RequestForm key={target.uid} target={target} onClose={onClose} onSend={onSend} />}
    </Modal>
  );
}

type FormData = { message: string };

function RequestForm({ target, onClose, onSend }: { target: IntroTarget } & Omit<Props, 'target'>) {
  const methods = useForm<FormData>({ defaultValues: { message: '' } });
  const { handleSubmit, reset, control } = methods;
  const message = useWatch({ control, name: 'message' }) ?? '';
  const canSend = message.trim().length > 0;
  const first = target.kind === 'member' ? target.name.split(' ')[0] : target.name;

  useEffect(() => () => reset(), [reset]);

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
          <p className={clsx(rc.desc, s.left)}>
            {`Your request goes to the PL team, who makes the intro. ${first} isn’t contacted until then.`}
          </p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form className={rc.form} onSubmit={handleSubmit((data) => onSend(target, data.message.trim()))}>
          <FormTextArea
            name="message"
            label="Why would you like an intro?"
            placeholder="Enter your message..."
            description={`Shared with ${first} if the intro is made.`}
            isRequired
            rows={8}
            maxLength={MESSAGE_MAX}
            showCharCount
          />

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
