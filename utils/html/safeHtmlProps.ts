import { sanitizeHtml } from './sanitizeHtml';
import type { SanitizeProfileName } from './sanitizeProfiles';

/**
 * Sanitized `dangerouslySetInnerHTML` for a native element, spread onto it:
 * `<div className="bio" {...safeHtmlProps(bio)} />`.
 *
 * Prefer `SafeHtml`. This exists for components styled with styled-jsx, which
 * scopes class names only on lowercase JSX elements, so the element that
 * carries the class cannot be a component.
 */
export function safeHtmlProps(html: string | null | undefined, profile: SanitizeProfileName = 'richText') {
  return { dangerouslySetInnerHTML: { __html: sanitizeHtml(html, profile) } };
}
