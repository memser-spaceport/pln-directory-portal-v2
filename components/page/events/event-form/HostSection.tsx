'use client';

import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/form/FormField';
import { TrashIcon } from '@/components/icons';
import type { EventFormCoHost, EventFormValues } from '@/services/events/event-submission.types';

import { useEventFormContext } from './EventFormContext';
import { FieldError } from './FieldError';
import s from './EventForm.module.scss';
import c from './HostSection.module.scss';

/** "Host (N)": the host's name and optional email, then a row of the same for every co-host. N counts them all. */
export function HostSection() {
  const {
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<EventFormValues>();
  const { busy } = useEventFormContext();
  const coHosts = watch('coHosts') ?? [];

  const write = (next: EventFormCoHost[]) => setValue('coHosts', next, { shouldDirty: true });

  const change = (index: number, field: keyof EventFormCoHost, value: string) => {
    write(coHosts.map((row, at) => (at === index ? { ...row, [field]: value } : row)));
    clearErrors(`coHosts.${index}.${field}`);
  };

  const remove = (index: number) => {
    write(coHosts.filter((_, at) => at !== index));
    // The rows after the removed one move up, so their messages no longer point at them.
    clearErrors('coHosts');
  };

  return (
    <section className={s.section} data-section="host">
      <div className={c.header}>
        <h2 className={clsx(s.sectionTitle, s.required)}>Host ({coHosts.length + 1})</h2>
        <button
          type="button"
          className={s.textButton}
          disabled={busy}
          onClick={() => write([...coHosts, { name: '', email: '' }])}
        >
          Add Co-Host
        </button>
      </div>
      <div className={s.row}>
        <FormField
          name="hostName"
          placeholder="Enter Host Name"
          aria-label="Host name"
          disabled={busy}
          rules={{ onChange: () => clearErrors('hostName') }}
        />
        <FormField
          name="hostEmail"
          placeholder="Enter Host Email"
          aria-label="Host email"
          inputMode="email"
          disabled={busy}
          rules={{ onChange: () => clearErrors('hostEmail') }}
        />
      </div>
      {coHosts.length > 0 && (
        <ul className={c.rows} aria-label="Co-hosts">
          {coHosts.map((row, index) => {
            const rowErrors = errors.coHosts?.[index];
            return (
              <li key={index} className={c.coHost}>
                <div className={s.row}>
                  <div className={c.cell}>
                    <input
                      type="text"
                      className={clsx(s.input, rowErrors?.name && s.inputInvalid)}
                      placeholder="Enter Co-Host Name"
                      aria-label={`Co-host ${index + 1} name`}
                      aria-invalid={!!rowErrors?.name || undefined}
                      value={row.name}
                      disabled={busy}
                      onChange={(event) => change(index, 'name', event.target.value)}
                    />
                    <FieldError message={rowErrors?.name?.message} />
                  </div>
                  <div className={c.cell}>
                    <input
                      type="text"
                      inputMode="email"
                      className={clsx(s.input, rowErrors?.email && s.inputInvalid)}
                      placeholder="Enter Co-Host Email"
                      aria-label={`Co-host ${index + 1} email`}
                      aria-invalid={!!rowErrors?.email || undefined}
                      value={row.email}
                      disabled={busy}
                      onChange={(event) => change(index, 'email', event.target.value)}
                    />
                    <FieldError message={rowErrors?.email?.message} />
                  </div>
                </div>
                <button
                  type="button"
                  className={s.iconButton}
                  aria-label={`Remove co-host ${index + 1}`}
                  disabled={busy}
                  onClick={() => remove(index)}
                >
                  <TrashIcon aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
