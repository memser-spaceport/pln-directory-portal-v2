import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

const INVESTORS_ANALYTICS_EVENTS = {
  PATHFINDER_PATHS_VIEWED: 'pathfinder-paths-viewed',
  PATHFINDER_PATH_EXPANDED: 'pathfinder-path-expanded',
  PATHFINDER_CORRECTION_SUBMITTED: 'pathfinder-correction-submitted',
  PATHFINDER_EXPORT: 'pathfinder-export',
  PATHFINDER_CROSSWALK_CONFIRMED: 'pathfinder-crosswalk-confirmed',
  PATHFINDER_CROSSWALK_REJECTED: 'pathfinder-crosswalk-rejected',
  LIST_SELECTED: 'investor-list-selected',
  CONNECTOR_LENS_APPLIED: 'investor-connector-lens-applied',
  ADDED_TO_LIST: 'investor-added-to-list',
  REMOVED_FROM_LIST: 'investor-removed-from-list',
  WORKSPACE_TAB_CHANGED: 'investors-workspace-tab-changed',
  DRAWER_OPENED: 'investor-drawer-opened',
  DRAWER_CLOSED: 'investor-drawer-closed',
  DRAWER_WARM_PATHS_VIEW_ALL_CLICKED: 'investor-drawer-warm-paths-view-all-clicked',
  DRAWER_CHANNEL_CLICKED: 'investor-drawer-channel-clicked',
  DRAWER_COPY_EMAIL_CLICKED: 'investor-drawer-copy-email-clicked',
  DRAWER_OPEN_IN_AFFINITY_CLICKED: 'investor-drawer-open-in-affinity-clicked',
  DRAWER_VIEW_IN_LABOS_CLICKED: 'investor-drawer-view-in-labos-clicked',
  GLOSSARY_OPENED: 'warm-intros-glossary-opened',
  CROSSWALK_OPENED: 'warm-intros-crosswalk-opened',
  PATHFINDER_CONTACT_DETAILS_EXPANDED: 'pathfinder-contact-details-expanded',
} as const;

export type InvestorDrawerSource = 'warm-intros-table' | 'all-investors-table';
export type InvestorDrawerChannel = 'email' | 'linkedin' | 'website';

export function useInvestorsAnalytics() {
  const posthog = usePostHog();

  const trackPathsViewed = useCallback(
    (params: { investorId: string; pathCount: number; bestProximityCode?: string | null }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.PATHFINDER_PATHS_VIEWED, params);
    },
    [posthog],
  );

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

  const trackListSelected = useCallback(
    (params: { listId: string; listName: string; isGraphed: boolean }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.LIST_SELECTED, params);
    },
    [posthog],
  );

  const trackConnectorLensApplied = useCallback(
    (params: { nodeLabel: string; kind: 'founder' | 'team' | 'investor' | 'pl_team' | 'fund' }) => {
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

  const trackWorkspaceTabChanged = useCallback(
    (params: { tab: 'warm-intros' | 'all'; previousTab: 'warm-intros' | 'all' }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.WORKSPACE_TAB_CHANGED, params);
    },
    [posthog],
  );

  const trackDrawerOpened = useCallback(
    (params: {
      investorId: string;
      source: InvestorDrawerSource;
      hasPath?: boolean;
      bestProximityCode?: string | null;
    }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.DRAWER_OPENED, params);
    },
    [posthog],
  );

  const trackDrawerClosed = useCallback(
    (params: { investorId: string; timeOpenMs: number }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.DRAWER_CLOSED, params);
    },
    [posthog],
  );

  const trackDrawerWarmPathsViewAllClicked = useCallback(
    (params: { investorId: string; pathCount?: number | null }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.DRAWER_WARM_PATHS_VIEW_ALL_CLICKED, params);
    },
    [posthog],
  );

  const trackDrawerChannelClicked = useCallback(
    (params: { investorId: string; channel: InvestorDrawerChannel }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.DRAWER_CHANNEL_CLICKED, params);
    },
    [posthog],
  );

  const trackDrawerCopyEmailClicked = useCallback(
    (params: { investorId: string }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.DRAWER_COPY_EMAIL_CLICKED, params);
    },
    [posthog],
  );

  const trackDrawerOpenInAffinityClicked = useCallback(
    (params: { investorId: string }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.DRAWER_OPEN_IN_AFFINITY_CLICKED, params);
    },
    [posthog],
  );

  const trackDrawerViewInLabOsClicked = useCallback(
    (params: { investorId: string; profileType: string }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.DRAWER_VIEW_IN_LABOS_CLICKED, params);
    },
    [posthog],
  );

  const trackGlossaryOpened = useCallback(() => {
    posthog?.capture(INVESTORS_ANALYTICS_EVENTS.GLOSSARY_OPENED);
  }, [posthog]);

  const trackCrosswalkOpened = useCallback(() => {
    posthog?.capture(INVESTORS_ANALYTICS_EVENTS.CROSSWALK_OPENED);
  }, [posthog]);

  const trackContactDetailsExpanded = useCallback(
    (params: { investorId: string; pathId: number }) => {
      posthog?.capture(INVESTORS_ANALYTICS_EVENTS.PATHFINDER_CONTACT_DETAILS_EXPANDED, params);
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
    trackWorkspaceTabChanged,
    trackDrawerOpened,
    trackDrawerClosed,
    trackDrawerWarmPathsViewAllClicked,
    trackDrawerChannelClicked,
    trackDrawerCopyEmailClicked,
    trackDrawerOpenInAffinityClicked,
    trackDrawerViewInLabOsClicked,
    trackGlossaryOpened,
    trackCrosswalkOpened,
    trackContactDetailsExpanded,
  };
}
