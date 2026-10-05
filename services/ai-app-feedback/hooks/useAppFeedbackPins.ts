'use client';

import { useQuery } from '@tanstack/react-query';
import { AiAppFeedbackQueryKeys } from '@/services/ai-app-feedback/constants';
import {
  fetchAppFeedbackPins,
  fetchMyAppFeedbackPins,
  type OverlayFeedbackPin,
} from '@/services/ai-app-feedback/ai-app-feedback.service';

const NO_PINS: OverlayFeedbackPin[] = [];

/** How often the pins are re-read while comment mode is on: other members' comments appear without a reload. */
export const LIVE_PINS_INTERVAL_MS = 60 * 1000;

/**
 * Pins for the feedback overlay. `scope` picks the endpoint: `all` (the API
 * decides what each viewer may read), `mine` for the viewer's own only, `null`
 * while the caller doesn't yet know (never fires a request). `live` (comment
 * mode on) re-reads them every minute and whenever the window regains focus.
 *
 *
 * Callers must gate `enabled` on being signed in: these are authenticated
 * requests, and customFetch reloads the page on a missing session.
 */
export function useAppFeedbackPins({
  appUid,
  scope,
  includeResolved,
  enabled,
  live = false,
}: {
  appUid: string;
  scope: 'all' | 'mine' | null;
  includeResolved: boolean;
  enabled: boolean;
  live?: boolean;
}) {
  const {
    data = NO_PINS,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_PINS, appUid, scope, scope === 'all' && includeResolved],
    queryFn: () =>
      scope === 'mine' ? fetchMyAppFeedbackPins(appUid) : fetchAppFeedbackPins(appUid, { includeResolved }),
    enabled: enabled && scope !== null && Boolean(appUid),
    staleTime: 60 * 1000,
    refetchInterval: live ? LIVE_PINS_INTERVAL_MS : false,
    refetchOnWindowFocus: live ? 'always' : true,
    retry: 1,
  });
  /* An array or nothing: callers count and filter it on every render. */
  return { pins: Array.isArray(data) ? data : NO_PINS, isLoading, isError, refetch };
}
