'use client';

import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';

import { TrashIcon } from '@/components/icons';
import { SOCIAL_PLATFORMS } from '@/services/events/event-form';
import type { EventFormSocialHandle, EventFormValues } from '@/services/events/event-submission.types';

import { useEventFormContext } from './EventFormContext';
import { EventSelect } from './EventSelect';
import { FieldError } from './FieldError';
import s from './EventForm.module.scss';
import c from './SocialHandlesSection.module.scss';

const EMPTY_ROW: EventFormSocialHandle = { platform: '', handle: '' };

/** The platform list, with a stored platform that is not in it kept as its own choice. */
function platformOptions(platform: string) {
  if (!platform || SOCIAL_PLATFORMS.some((option) => option.value === platform)) return SOCIAL_PLATFORMS;
  return [...SOCIAL_PLATFORMS, { value: platform, label: platform.charAt(0).toUpperCase() + platform.slice(1) }];
}

/**
 * Edit page only: "Social Handles", rows of a platform and a handle. An empty list shows one empty row, which is
 * written to the form once the person fills it in.
 */
export function SocialHandlesSection() {
  const {
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<EventFormValues>();
  const { busy } = useEventFormContext();
  const stored = watch('socialHandles') ?? [];
  const rows = stored.length ? stored : [EMPTY_ROW];

  const write = (next: EventFormSocialHandle[]) => setValue('socialHandles', next, { shouldDirty: true });

  const change = (index: number, field: keyof EventFormSocialHandle, value: string) => {
    write(rows.map((row, at) => (at === index ? { ...row, [field]: value } : row)));
    clearErrors(`socialHandles.${index}.handle`);
  };

  const remove = (index: number) => {
    write(stored.filter((_, at) => at !== index));
    // The rows after the removed one move up, so their messages no longer point at them.
    clearErrors('socialHandles');
  };

  return (
    <section className={s.section} data-section="social-handles">
      <div className={c.header}>
        <h2 className={s.sectionTitle}>Social Handles</h2>
        <button type="button" className={s.textButton} disabled={busy} onClick={() => write([...rows, EMPTY_ROW])}>
          Add More
        </button>
      </div>
      <ul className={c.rows} aria-label="Social handles">
        {rows.map((row, index) => {
          const message = errors.socialHandles?.[index]?.handle?.message;
          return (
            <li key={index} className={c.item}>
              <div className={c.fields}>
                <EventSelect
                  className={c.platform}
                  aria-label={`Social platform ${index + 1}`}
                  placeholder="Select platform"
                  value={row.platform}
                  options={platformOptions(row.platform)}
                  invalid={!!message && !row.platform}
                  disabled={busy}
                  onChange={(platform) => change(index, 'platform', platform)}
                />
                <input
                  type="text"
                  className={clsx(s.input, c.handle, message && row.platform && s.inputInvalid)}
                  placeholder="Enter your handle"
                  aria-label={`Social handle ${index + 1}`}
                  aria-invalid={!!message || undefined}
                  autoComplete="off"
                  value={row.handle}
                  disabled={busy}
                  onChange={(event) => change(index, 'handle', event.target.value)}
                />
                <button
                  type="button"
                  className={s.iconButton}
                  aria-label={`Remove social handle ${index + 1}`}
                  disabled={busy || !stored.length}
                  onClick={() => remove(index)}
                >
                  <TrashIcon aria-hidden />
                </button>
              </div>
              <FieldError message={message} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
