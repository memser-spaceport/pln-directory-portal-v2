'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { EVENT_NAME_MAX } from '@/services/events/event-form';
import type { EventFormValues } from '@/services/events/event-submission.types';

import { useEventFormContext } from './EventFormContext';
import { FieldError } from './FieldError';
import { LogoTile } from './LogoTile';
import s from './EventForm.module.scss';
import p from './ProfileSection.module.scss';

/** The event's logo with its name beside it. The name holds at most 100 characters; the rest is cut. */
export function ProfileSection() {
  const {
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<EventFormValues>();
  const { busy } = useEventFormContext();
  const name = watch('name') ?? '';
  const nameError = errors.name?.message;
  const [logoError, setLogoError] = useState<string | null>(null);

  return (
    <section className={s.section} data-section="profile">
      <div className={p.profile}>
        <LogoTile onIssue={setLogoError} />
        <input
          type="text"
          className={clsx(p.name, nameError && p.nameInvalid)}
          aria-label="Event name"
          aria-invalid={nameError ? true : undefined}
          data-invalid={nameError ? true : undefined}
          placeholder="Enter Event Name"
          maxLength={EVENT_NAME_MAX}
          autoComplete="off"
          value={name}
          disabled={busy}
          onChange={(event) => {
            setValue('name', event.target.value.slice(0, EVENT_NAME_MAX), { shouldDirty: true });
            clearErrors('name');
          }}
        />
      </div>
      <FieldError message={logoError} />
      <FieldError message={nameError} />
    </section>
  );
}
