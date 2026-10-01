'use client';

import { useQuery } from '@tanstack/react-query';
import { AiAppFeedbackQueryKeys } from '@/services/ai-app-feedback/constants';
import {
  fetchAppFeedbackPins,
  fetchMyAppFeedbackPins,
  type OverlayFeedbackPin,
} from '@/services/ai-app-feedback/ai-app-feedback.service';

const NO_PINS: OverlayFeedbackPin[] = [];

/**
 * Pins for the feedback overlay. `scope` picks the endpoint: `all` for the
 * creator and directory admins, `mine` for anyone else, `null` while the
 * caller doesn't yet know which (never fires a request).
 *
 * Callers must gate `enabled` on being signed in: these are authenticated
 * requests, and customFetch reloads the page on a missing session.
 */
export function useAppFeedbackPins({
  appUid,
  scope,
  includeResolved,
  enabled,
}: {
  appUid: string;
  scope: 'all' | 'mine' | null;
  includeResolved: boolean;
  enabled: boolean;
}) {
  const {
    data = NO_PINS,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_PINS, appUid, scope, scope === 'all' && includeResolved],
    queryFn: () =>
      scope === 'mine' ? fetchMyAppFeedbackPins(appUid) : fetchAppFeedbackPins(appUid, { includeResolved }),
    enabled: enabled && scope !== null && Boolean(appUid),
    staleTime: 60 * 1000,
    retry: 1,
  });
  /* An array or nothing: callers count and filter it on every render. */
  return { pins: Array.isArray(data) ? data : NO_PINS, isLoading, isError };
}
