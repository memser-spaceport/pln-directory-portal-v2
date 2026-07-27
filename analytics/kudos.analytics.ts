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
