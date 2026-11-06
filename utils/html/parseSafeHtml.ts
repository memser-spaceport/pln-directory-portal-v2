import parse, { type HTMLReactParserOptions } from 'html-react-parser';

import { sanitizeHtml } from './sanitizeHtml';
import type { SanitizeProfileName } from './sanitizeProfiles';

/** `html-react-parser` over sanitizer output: React elements for member- or AI-written HTML. */
export function parseSafeHtml(
  html: string | null | undefined,
  profile: SanitizeProfileName = 'richText',
  options?: HTMLReactParserOptions,
) {
  return parse(sanitizeHtml(html, profile), options);
}
