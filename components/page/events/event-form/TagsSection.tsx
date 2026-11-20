'use client';

import clsx from 'clsx';
import { type KeyboardEvent, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { CloseIcon } from '@/components/icons';
import { DEFAULT_EVENT_TAGS } from '@/services/events/event-form';
import type { EventFormValues } from '@/services/events/event-submission.types';

import { useEventFormContext } from './EventFormContext';
import { FieldError } from './FieldError';
import s from './EventForm.module.scss';
import c from './TagsSection.module.scss';

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * "Choose Event tag(s)": the default tags as chips that switch on and off, and a field where Enter adds a custom
 * tag. A typed tag that is already selected is ignored; one that names a default tag switches that chip on.
 */
export function TagsSection() {
  const {
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<EventFormValues>();
  const { busy } = useEventFormContext();
  const [typed, setTyped] = useState('');
  const tags = watch('tags') ?? [];
  const custom = tags.filter((tag) => !DEFAULT_EVENT_TAGS.includes(tag));

  const write = (next: string[]) => {
    setValue('tags', next, { shouldDirty: true });
    clearErrors('tags');
  };

  const toggle = (tag: string) => write(tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const tag = typed.trim();
    setTyped('');
    if (!tag || tags.some((item) => same(item, tag))) return;
    write([...tags, DEFAULT_EVENT_TAGS.find((item) => same(item, tag)) ?? tag]);
  };

  return (
    <section className={s.section} data-section="tags">
      <h2 className={s.sectionTitle} id="event-tags-title">
        Choose Event tag(s)
      </h2>
      <div className={s.choices} role="group" aria-labelledby="event-tags-title">
        {DEFAULT_EVENT_TAGS.map((tag) => {
          const on = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              className={clsx(s.choice, on && s.choiceOn)}
              disabled={busy}
              onClick={() => toggle(tag)}
            >
              {tag}
            </button>
          );
        })}
        {custom.map((tag) => (
          <span key={tag} className={clsx(s.choice, s.choiceOn, c.custom)}>
            <span className={c.customText}>{tag}</span>
            <button
              type="button"
              className={c.remove}
              aria-label={`Remove tag ${tag}`}
              disabled={busy}
              onClick={() => write(tags.filter((item) => item !== tag))}
            >
              <CloseIcon aria-hidden />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className={clsx(s.input, errors.tags && s.inputInvalid)}
        placeholder="Type your tag here"
        aria-label="Custom tag"
        autoComplete="off"
        value={typed}
        disabled={busy}
        onChange={(event) => setTyped(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <FieldError message={errors.tags?.message} />
    </section>
  );
}
