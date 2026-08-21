import { SocialField, looksLikeUrl, requiresAtPrefix } from '@/utils/profile/validateSocialField';

/**
 * Turns a stored handle into the value a contact form should show for it.
 *
 * Handles are persisted bare — `getProfileFromURL` strips the `@` before the payload is sent — but
 * the X / Telegram / Bluesky fields require one on input. Seeding those fields with the raw stored
 * value would therefore fail validation on a field the user never touched, blocking every save on
 * an existing profile. Adding the `@` back on the way in is what closes that loop; submitting
 * strips it again, so nothing about what's stored changes.
 *
 * Empty and nullish values pass through untouched, so a field that was never filled in still
 * submits as `null` rather than becoming an empty string.
 */
export function toSocialFieldInputValue(
  field: SocialField,
  value: string | null | undefined,
): string | null | undefined {
  if (!value) {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed || !requiresAtPrefix(field) || looksLikeUrl(trimmed)) {
    return value;
  }

  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}
