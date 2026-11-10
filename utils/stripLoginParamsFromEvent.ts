import type { CaptureResult } from 'posthog-js';
import isString from 'lodash/isString';
import cloneDeepWith from 'lodash/cloneDeepWith';

// Invite links sign the member in through these query params. PostHog records page URLs
// (current, referrer, initial person info, session entry) before the app strips them,
// so a captured loginToken would be a usable sign-in credential in analytics.
const LOGIN_URL_PARAMS = ['loginToken', 'prefillEmail'];

export function stripLoginParamsFromEvent(event: CaptureResult | null): CaptureResult | null {
  return cloneDeepWith(event, (value) => (isString(value) ? removeLoginParams(value) : undefined));
}

function removeLoginParams(text: string): string {
  const hashStart = text.includes('#') ? text.indexOf('#') : text.length;
  const queryStart = text.indexOf('?');
  if (queryStart === -1 || queryStart > hashStart || !LOGIN_URL_PARAMS.some((param) => text.includes(`${param}=`))) {
    return text;
  }

  const params = new URLSearchParams(text.slice(queryStart + 1, hashStart));
  LOGIN_URL_PARAMS.forEach((param) => params.delete(param));
  const query = params.toString();

  return `${text.slice(0, queryStart)}${query ? `?${query}` : ''}${text.slice(hashStart)}`;
}
