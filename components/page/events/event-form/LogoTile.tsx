'use client';

import { useDropzone } from 'react-dropzone';
import { useFormContext } from 'react-hook-form';

import type { EventFormValues } from '@/services/events/event-submission.types';

import { useEventFormContext } from './EventFormContext';
import { fileLogo, LOGO_ACCEPT, logoIssue, releaseLogo } from './eventLogo';
import p from './LogoTile.module.scss';

interface LogoTileProps {
  /** Why the picked file was not taken, or null when a pick starts, succeeds or the logo is deleted. */
  onIssue: (message: string | null) => void;
}

/**
 * The optional event logo: a PNG or JPEG, picked or dropped. A file that breaks a rule is not attached and the
 * earlier logo stays. The file stays in the form value; the page uploads it when the form is sent.
 */
export function LogoTile({ onIssue }: LogoTileProps) {
  const { watch, getValues, setValue } = useFormContext<EventFormValues>();
  const { busy } = useEventFormContext();
  const logo = watch('logo');
  const picture = logo ? (logo.kind === 'file' ? logo.previewUrl : logo.url) : null;

  const take = async (file: File | undefined) => {
    if (!file) return;
    onIssue(null);
    const issue = await logoIssue(file);
    if (issue) {
      onIssue(issue);
      return;
    }
    releaseLogo(getValues('logo'));
    setValue('logo', fileLogo(file), { shouldDirty: true });
  };

  const remove = () => {
    onIssue(null);
    releaseLogo(getValues('logo'));
    setValue('logo', null, { shouldDirty: true });
  };

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept: LOGO_ACCEPT,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: busy,
    onDrop: (accepted) => void take(accepted[0]),
  });

  return (
    <div {...getRootProps({ className: p.tile })} data-drag={isDragActive || undefined}>
      <input {...getInputProps({ 'aria-label': 'Event logo file' })} />
      {picture ? (
        <>
          <img src={picture} alt="Event logo" className={p.picture} />
          <div className={p.controls}>
            <button type="button" className={p.control} aria-label="Replace logo" disabled={busy} onClick={open}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M2.5 6.5a5.5 5.5 0 0 1 9.6-2.6L13.5 5.5M13.5 2v3.5H10M13.5 9.5a5.5 5.5 0 0 1-9.6 2.6L2.5 10.5M2.5 14v-3.5H6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button type="button" className={p.control} aria-label="Delete logo" disabled={busy} onClick={remove}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M2.5 4h11M6 4V2.5h4V4M4 4l.6 9.5h6.8L12 4M6.5 6.5v4.5M9.5 6.5v4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <button type="button" className={p.upload} aria-label="Upload logo" disabled={busy} onClick={open}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5v-9ZM3 13l3.6-3.6a1 1 0 0 1 1.4 0L12 13.5M11 12.5l1.6-1.6a1 1 0 0 1 1.4 0L17 14M12.5 7.5h.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
