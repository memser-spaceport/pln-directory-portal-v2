import DOMPurify from 'isomorphic-dompurify';

import { SANITIZE_PROFILES, type SanitizeProfileName } from './sanitizeProfiles';

/**
 * The one place member- or AI-written HTML is cleaned before it reaches the
 * page. Render the result with `SafeHtml` or `parseSafeHtml`; pick the profile
 * that matches the content (see `sanitizeProfiles.ts`), `richText` by default.
 */
export function sanitizeHtml(html: string | null | undefined, profile: SanitizeProfileName = 'richText'): string {
  if (!html) return '';
  const { styleProperties, imageSrc, ...config } = SANITIZE_PROFILES[profile];
  allowedStyleProperties = styleProperties ?? null;
  allowedImageSrc = imageSrc ?? null;
  try {
    return DOMPurify.sanitize(html, config);
  } finally {
    allowedStyleProperties = null;
    allowedImageSrc = null;
  }
}

// DOMPurify hooks are global, so the active profile's style and image rules are
// handed to the hook through module state for the length of one synchronous
// sanitize call.
let allowedStyleProperties: readonly string[] | null = null;
let allowedImageSrc: RegExp | null = null;

// A colour keyword, hex, or rgb()/hsl() with plain numeric arguments. Anything
// else (url(), var(), expression(), escapes, strings) is dropped.
const SAFE_COLOR_VALUE = /^(?:#[0-9a-f]{3,8}|[a-z]+|(?:rgba?|hsla?)\([\d\s.,%/deg]*\))$/i;

// The values each keepable property may take. A property a profile lists but
// this map does not know is dropped.
const SAFE_STYLE_VALUES: Record<string, RegExp> = {
  color: SAFE_COLOR_VALUE,
  'background-color': SAFE_COLOR_VALUE,
  'text-align': /^(?:left|right|center|justify|start|end)$/i,
  'white-space': /^(?:normal|nowrap|pre|pre-wrap|pre-line|break-spaces)$/i,
};

export function filterStyle(style: string, properties: readonly string[]): string {
  return style
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(';')
    .map((declaration) => {
      const colon = declaration.indexOf(':');
      if (colon === -1) return null;
      const property = declaration.slice(0, colon).trim().toLowerCase();
      const value = declaration
        .slice(colon + 1)
        .replace(/!important\s*$/i, '')
        .trim();
      if (!properties.includes(property) || !SAFE_STYLE_VALUES[property]?.test(value)) return null;
      return `${property}: ${value}`;
    })
    .filter(Boolean)
    .join('; ');
}

DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (data.attrName === 'src' && node.tagName === 'IMG' && allowedImageSrc) {
    if (!allowedImageSrc.test(data.attrValue.trim())) data.keepAttr = false;
    return;
  }
  if (data.attrName !== 'style' || !allowedStyleProperties) return;
  const filtered = filterStyle(data.attrValue, allowedStyleProperties);
  if (filtered) {
    data.attrValue = filtered;
  } else {
    data.keepAttr = false;
  }
});

// Forcing target/rel after sanitizing is the canonical cure53 pattern: set
// before, they would be checked against the profile like any other attribute.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});
