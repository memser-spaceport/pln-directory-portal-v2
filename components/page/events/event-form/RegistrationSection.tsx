'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useEventsAnalytics } from '@/analytics/events.analytics';
import { toast } from '@/components/core/ToastContainer';
import { FormField } from '@/components/form/FormField';
import { applyLumaEvent, isLumaUrl, toHttpUrl } from '@/services/events/event-form';
import { EventRequestError, importFromLuma } from '@/services/events/event-submission.service';
import type { EventFormValues } from '@/services/events/event-submission.types';

import { useEventFormContext } from './EventFormContext';
import { fileLogo, releaseLogo } from './eventLogo';
import { LumaStrip } from './LumaStrip';
import s from './EventForm.module.scss';

const IMPORT_FAILED = 'Could not import this event from Luma. Please try again.';

/** The Luma event's picture as a file, or null when it cannot be fetched or is not an image. */
async function fetchLumaLogo(url: string): Promise<File | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) return null;
    return new File([blob], `luma-logo.${blob.type.split('/')[1] || 'png'}`, { type: blob.type });
  } catch {
    return null;
  }
}

/**
 * The registration link. A `luma.com` or `lu.ma` address offers to fill the form from that Luma event; a failed
 * import says why and leaves the form as it was.
 */
export function RegistrationSection() {
  const { watch, getValues, reset } = useFormContext<EventFormValues>();
  const { signedIn, busy } = useEventFormContext();
  const { onEventsLumaImported } = useEventsAnalytics();
  const url = watch('registrationUrl') ?? '';
  const [importing, setImporting] = useState(false);
  // The link the form was last filled from: the strip reads "imported" while the field still holds it.
  const [importedUrl, setImportedUrl] = useState<string | null>(null);

  const runImport = async () => {
    const address = toHttpUrl(url);
    if (!address || importing) return;
    setImporting(true);
    try {
      const luma = await importFromLuma(address, signedIn);
      const logoFile = luma.logoUrl ? await fetchLumaLogo(luma.logoUrl) : null;
      const current = getValues();
      const next = applyLumaEvent(current, luma);
      if (logoFile) {
        releaseLogo(current.logo);
        next.logo = fileLogo(logoFile);
      }
      reset(next, { keepDefaultValues: true });
      setImportedUrl(next.registrationUrl);
      onEventsLumaImported();
    } catch (error) {
      toast.error(error instanceof EventRequestError && error.status === 404 ? error.message : IMPORT_FAILED);
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className={s.section} data-section="registration">
      <FormField
        name="registrationUrl"
        label="Registration Link"
        placeholder="Enter Registration Link"
        disabled={busy}
      />
      {isLumaUrl(url) && (
        <LumaStrip
          state={importing ? 'importing' : importedUrl === url ? 'imported' : 'detected'}
          disabled={busy}
          onFetch={runImport}
        />
      )}
    </section>
  );
}
