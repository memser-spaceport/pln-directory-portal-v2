/**
 * Client-side mirror of the web-api public path rules (`ai-apps-public-paths.ts`
 * in pln-directory-portal) for inline feedback — the server stays the
 * authority, and its 400 message names anything it rejects.
 */
export const AI_APPS_MAX_PUBLIC_PATHS = 20;
export const AI_APPS_MAX_PUBLIC_PATH_LENGTH = 200;

const PATTERN_CHARS = /^[A-Za-z0-9\-._~!$&'()+,;=:@/*]*$/;

/** Why a pattern is invalid, or null when it is valid. */
export function validatePublicPath(pattern: string): string | null {
  if (!pattern) {
    return 'Enter a path, e.g. /api/*';
  }
  if (!pattern.startsWith('/')) {
    return 'Start the path with /';
  }
  if (pattern.length > AI_APPS_MAX_PUBLIC_PATH_LENGTH) {
    return `Keep it under ${AI_APPS_MAX_PUBLIC_PATH_LENGTH} characters`;
  }
  if (!PATTERN_CHARS.test(pattern)) {
    return 'Use plain path characters and * only (no spaces, ?, # or %)';
  }
  if (pattern.includes('//')) {
    return 'Remove the empty segment (//)';
  }
  const segments = pattern.slice(1).split('/');
  if (!segments[0] || segments[0].includes('*')) {
    return 'The first segment must be a fixed name (e.g. /api/*) — the whole app can’t be public';
  }
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    return 'Remove . or .. segments';
  }
  return null;
}
