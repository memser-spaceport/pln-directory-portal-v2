import { looksLikeUrl } from '@/utils/profile/validateSocialField';

/**
 * The link the note and the send carry, from whatever the LinkedIn field accepted.
 *
 * The field runs the profile form's own rule (`validateSocialField('linkedin')`),
 * which takes a bare slug as well as a URL — and a slug in an email is not
 * something anyone can click. A URL is kept as typed (scheme added if missing);
 * a slug becomes the `/in/` address the rule's own example uses.
 */
export function linkedinProfileUrl(value: string): string {
  const trimmed = value.trim();
  if (looksLikeUrl(trimmed)) {
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }
  return `https://linkedin.com/in/${trimmed}`;
}
