import { demoteTopHeadings } from './demoteTopHeadings';
import { sanitizeHtml } from './sanitizeHtml';
import type { SanitizeProfileName } from './sanitizeProfiles';

export type SafeHtmlOptions = {
  /**
   * Render the content's own `h1` and `h2` as `h3`. For a description inside a page that has its own `h1`, such as
   * a team, member or project profile (LAB-3089).
   */
  demoteHeadings?: boolean;
};

/**
 * Sanitized `dangerouslySetInnerHTML` for a native element, spread onto it:
 * `<div className="bio" {...safeHtmlProps(bio)} />`.
 *
 * Prefer `SafeHtml`. This exists for components styled with styled-jsx, which
 * scopes class names only on lowercase JSX elements, so the element that
 * carries the class cannot be a component.
 */
export function safeHtmlProps(
  html: string | null | undefined,
  profile: SanitizeProfileName = 'richText',
  { demoteHeadings = false }: SafeHtmlOptions = {},
) {
  const clean = sanitizeHtml(html, profile);
  return { dangerouslySetInnerHTML: { __html: demoteHeadings ? demoteTopHeadings(clean) : clean } };
}
