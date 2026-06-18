import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

// Investor DB / PL Path Finder analytics. Kebab-case event names per the
// team convention (see founder-guides.analytics.ts).
const INVESTORS_ANALYTICS_EVENTS = {
  PATHFINDER_PATHS_VIEWED: 'pathfinder-paths-viewed',
  PATHFINDER_PATH_EXPANDED: 'pathfinder-path-expanded',
  PATHFINDER_CORRECTION_SUBMITTED: 'pathfinder-correction-submitted',
  PATHFINDER_EXPORT: 'pathfinder-export',
  PATHFINDER_CROSSWALK_CONFIRMED: 'pathfinder-crosswalk-confirmed',
  PATHFINDER_CROSSWALK_REJECTED: 'pathfinder-crosswalk-rejected',
  // Lists IA
  LIST_SELECTED: 'investor-list-selected',
  CONNECTOR_LENS_APPLIED: 'investor-connector-lens-applied',
  ADDED_TO_LIST: 'investor-added-to-list',
  REMOVED_FROM_LIST: 'investor-removed-from-list',
} as const;

export function useInvestorsAnalytics() {
  const posthog = usePostHog();

  /** Fired once per target when its ranked path list first loads in the drawer/expand. */
  const trackPathsViewed = useCallback(
    (params: { investorId: string; pathCount: number; bestProximityCode?: string | null }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.PATHFINDER_PATHS_VIEWED, params);
    },
    [posthog],
  );

  /** Fired when the user expands a candidate row to reveal its warm paths. */
  const trackPathExpanded = useCallback(
    (params: { investorId: string; bestProximityCode?: string | null }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.PATHFINDER_PATH_EXPANDED, params);
    },
    [posthog],
  );

  const trackCorrectionSubmitted = useCallback(
    (params: { investorId: string; pathId: number; subjectType: string; field: string }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.PATHFINDER_CORRECTION_SUBMITTED, params);
    },
    [posthog],
  );

  const trackExport = useCallback(
    (params: { count: number; teamName?: string }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.PATHFINDER_EXPORT, params);
    },
    [posthog],
  );

  const trackCrosswalkConfirmed = useCallback(
    (params: { crosswalkId: string }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.PATHFINDER_CROSSWALK_CONFIRMED, params);
    },
    [posthog],
  );

  const trackCrosswalkRejected = useCallback(
    (params: { crosswalkId: string }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.PATHFINDER_CROSSWALK_REJECTED, params);
    },
    [posthog],
  );

  /** Fired when the user picks a target list in the warm-intros workspace. */
  const trackListSelected = useCallback(
    (params: { listId: string; listName: string; isGraphed: boolean }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.LIST_SELECTED, params);
    },
    [posthog],
  );

  /** Fired when a unified-search result applies the connector-lens filter. */
  const trackConnectorLensApplied = useCallback(
    (params: { nodeLabel: string; kind: 'founder' | 'team' | 'investor' | 'pl_team' }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.CONNECTOR_LENS_APPLIED, params);
    },
    [posthog],
  );

  const trackAddedToList = useCallback(
    (params: { listId: string; investorId: string }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.ADDED_TO_LIST, params);
    },
    [posthog],
  );

  const trackRemovedFromList = useCallback(
    (params: { listId: string; investorId: string }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.REMOVED_FROM_LIST, params);
    },
    [posthog],
  );

  return {
    trackPathsViewed,
    trackPathExpanded,
    trackCorrectionSubmitted,
    trackExport,
    trackCrosswalkConfirmed,
    trackCrosswalkRejected,
    trackListSelected,
    trackConnectorLensApplied,
    trackAddedToList,
    trackRemovedFromList,
  };
}
