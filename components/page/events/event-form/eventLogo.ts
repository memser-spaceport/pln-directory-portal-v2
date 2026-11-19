import { EVENT_FORM_TEXT } from '@/services/events/event-form';
import type { EventFormLogo } from '@/services/events/event-submission.types';

import { readImageSize } from './readImageSize';

export const LOGO_ACCEPT = { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] };
const LOGO_MAX_BYTES = 4 * 1024 * 1024;
/** How far the width and the height may differ, in pixels, for the image to count as square. */
const LOGO_SQUARE_TOLERANCE = 10;

/** Why a picked file cannot be the logo, or null when it can. A file that cannot be decoded reads as not square. */
export async function logoIssue(file: File): Promise<string | null> {
  if (file.size > LOGO_MAX_BYTES) return EVENT_FORM_TEXT.logoTooLarge;
  try {
    const { width, height } = await readImageSize(file);
    return Math.abs(width - height) > LOGO_SQUARE_TOLERANCE ? EVENT_FORM_TEXT.logoNotSquare : null;
  } catch {
    return EVENT_FORM_TEXT.logoNotSquare;
  }
}

/** A file as the form's logo value, with an address to show it by. */
export function fileLogo(file: File): EventFormLogo {
  return { kind: 'file', file, previewUrl: URL.createObjectURL(file) };
}

/** Frees the preview address of a file logo that the form no longer holds. */
export function releaseLogo(logo: EventFormLogo) {
  if (logo?.kind === 'file') URL.revokeObjectURL(logo.previewUrl);
}
