'use client';

import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/form/FormField';
import { EVENT_LINK_MAX, isValidUrl } from '@/services/events/event-form';
import type { EventFormValues } from '@/services/events/event-submission.types';

import { useEventFormContext } from './EventFormContext';

type LinkName = 'registrationUrl' | 'meetingUrl' | 'websiteUrl';

interface LinkFieldProps {
  name: LinkName;
  label: string;
  placeholder: string;
  /** The message for an address that is not a web link. */
  invalidMessage: string;
}

/**
 * An optional web link, checked the way other LabOS link fields check theirs: at most 2048 characters; on leaving the
 * field, "https://" goes in front of an address that has no scheme and the address is checked; once a message shows,
 * it is checked again on every change and goes away as soon as the address is valid.
 */
export function LinkField({ name, label, placeholder, invalidMessage }: LinkFieldProps) {
  const {
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext<EventFormValues>();
  const { busy } = useEventFormContext();

  const check = (value: string) => {
    if (!value.trim() || isValidUrl(value)) clearErrors(name);
    else setError(name, { type: 'manual', message: invalidMessage });
  };

  const onBlur = () => {
    const value = (getValues(name) ?? '').trim();
    const withScheme = value && !/^https?:\/\//i.test(value) ? `https://${value}` : value;
    if (withScheme !== getValues(name)) setValue(name, withScheme, { shouldDirty: true });
    check(withScheme);
  };

  return (
    <FormField
      name={name}
      label={label}
      placeholder={placeholder}
      inputMode="url"
      maxLength={EVENT_LINK_MAX}
      disabled={busy}
      onBlur={onBlur}
      rules={{
        onChange: (event: { target: { value: string } }) => {
          if (errors[name]) check(event.target.value);
        },
      }}
    />
  );
}
