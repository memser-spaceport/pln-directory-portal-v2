import { createElement, useMemo, type HTMLAttributes, type Ref } from 'react';

import { safeHtmlProps } from '@/utils/html/safeHtmlProps';
import type { SanitizeProfileName } from '@/utils/html/sanitizeProfiles';

type Props = Omit<HTMLAttributes<HTMLElement>, 'children' | 'dangerouslySetInnerHTML'> & {
  /** Member- or AI-written HTML. Rendered only after `sanitizeHtml`. */
  html: string | null | undefined;
  /** Allowlist to sanitize with; see `utils/html/sanitizeProfiles.ts`. */
  profile?: SanitizeProfileName;
  /** Wrapper element. */
  as?: 'div' | 'p' | 'span' | 'section' | 'article';
  ref?: Ref<HTMLElement>;
};

/**
 * The one component that turns an HTML string into DOM. Not a client
 * component: server components render it too, so profile HTML stays in the
 * first response. In a styled-jsx component, spread `safeHtmlProps` on the
 * native element instead (styled-jsx does not scope a component's className).
 */
export function SafeHtml({ html, profile = 'richText', as = 'div', ...rest }: Props) {
  const htmlProps = useMemo(() => safeHtmlProps(html, profile), [html, profile]);
  return createElement(as, { ...rest, ...htmlProps });
}
