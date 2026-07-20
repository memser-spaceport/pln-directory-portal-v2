/**
 * Community Kudos (Lite) analytics hook.
 *
 * Wired to posthog-js via `usePostHog()`, the same client the rest of the app
 * uses (see `@/analytics/affinity.analytics`).
 *
 * PRIVACY: never pass PII (names, emails) into analytics payloads — use stable
 * member ids and counts only.
 */

'use client';

import { usePostHog } from 'posthog-js/react';

interface IAnalyticsPayload {
  [key: string]: string | number | boolean | undefined;
}

export function useKudosAnalytics() {
  const postHog = usePostHog();

  const track = (event: string, payload: IAnalyticsPayload = {}) => {
    try {
      postHog?.capture?.(event, payload);
    } catch (e) {
      console.error(e);
    }
  };

  return {
    onKudosPageViewed: () => track('plaa.kudos.page_viewed'),
    onGiveKudosOpened: () => track('plaa.kudos.give_modal_opened'),
    onCommunityKudosSubmitted: (payload: { points: number; recipientId: string }) =>
      track('plaa.kudos.community.submitted', payload),
  };
}
