'use client';

import { type KeyboardEvent, type ReactNode, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { checkEventForm, hasEventFormErrors } from '@/services/events/event-form';
import type { EventFormMode, EventFormValues } from '@/services/events/event-submission.types';

import { AccessSection } from './AccessSection';
import { DatesSection } from './DatesSection';
import { DescriptionSection } from './DescriptionSection';
import { EventFormProvider } from './EventFormContext';
import { showEventFormErrors } from './eventFormErrors';
import { FormatSection } from './FormatSection';
import { HostSection } from './HostSection';
import { ProfileSection } from './ProfileSection';
import { RegistrationSection } from './RegistrationSection';
import { SocialHandlesSection } from './SocialHandlesSection';
import { TagsSection } from './TagsSection';
import { WebsiteSection } from './WebsiteSection';
import s from './EventForm.module.scss';

/** What a page's buttons get: a way to run the form in a mode, the values typed so far, and a reset. */
export interface EventFormHandle {
  /** Runs the checks for the mode; when they pass, sends the form through `onSend`. */
  run: (mode: EventFormMode) => Promise<void>;
  getValues: () => EventFormValues;
  /** Every field back to the given values, with no messages. Nothing is sent. */
  reset: (values: EventFormValues) => void;
}

export interface EventFormProps {
  variant: 'submit' | 'edit';
  initialValues: EventFormValues;
  /** Sends the checked values. It may throw; the form keeps everything typed either way. */
  onSend: (values: EventFormValues, mode: EventFormMode) => Promise<void>;
  /** A check failed and nothing was sent. */
  onInvalid?: () => void;
  /** The page's buttons, drawn under the last section. `busy` is true while a request runs. */
  renderActions: (state: { busy: boolean }) => ReactNode;
  ref?: Ref<EventFormHandle>;
}

/** Enter submits nothing: in a single-line field it is swallowed; a text area and the editor keep their new line. */
function swallowEnter(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key !== 'Enter') return;
  const target = event.target as HTMLElement;
  if (target.tagName === 'TEXTAREA' || target.isContentEditable || target.tagName === 'BUTTON') return;
  event.preventDefault();
}

/**
 * The event form of the submit page and the edit page: the old submission portal's sections in their order, built
 * from LabOS form parts. It holds the values, runs the checks, shows each message under its field and scrolls to the
 * first one. The page decides the buttons and what sending means.
 */
export function EventForm({ variant, initialValues, onSend, onInvalid, renderActions, ref }: EventFormProps) {
  const methods = useForm<EventFormValues>({ defaultValues: initialValues, shouldUnregister: false });
  const formRef = useRef<HTMLFormElement>(null);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);

  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      const first = formRef.current?.querySelector('[data-field-error], [data-invalid]');
      first?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    });
  };

  const run = async (mode: EventFormMode) => {
    // A second press while the first is in flight sends nothing.
    if (running.current) return;
    const values = methods.getValues();
    const errors = checkEventForm(values, mode);
    showEventFormErrors(errors, methods.setError, methods.clearErrors);
    if (hasEventFormErrors(errors)) {
      onInvalid?.();
      scrollToFirstError();
      return;
    }
    running.current = true;
    setBusy(true);
    try {
      await onSend(values, mode);
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  useImperativeHandle(ref, () => ({
    run,
    getValues: methods.getValues,
    reset: (values) => methods.reset(values),
  }));

  return (
    <FormProvider {...methods}>
      <EventFormProvider value={{ variant, busy }}>
        <form
          ref={formRef}
          className={s.form}
          noValidate
          onSubmit={(event) => event.preventDefault()}
          onKeyDown={swallowEnter}
          aria-busy={busy}
        >
          <AccessSection />
          <RegistrationSection />
          <ProfileSection />
          <FormatSection />
          <DatesSection />
          <DescriptionSection />
          <TagsSection />
          <HostSection />
          {variant === 'edit' && <WebsiteSection />}
          {variant === 'edit' && <SocialHandlesSection />}
          <div className={s.actions}>{renderActions({ busy })}</div>
        </form>
      </EventFormProvider>
    </FormProvider>
  );
}
