import { useCallback, useState } from 'react';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';

import type { ElementPinsController } from '../../element-pins';

export function usePinSession(elementPins?: ElementPinsController, appUid?: string) {
  const [isPinMode, setIsPinMode] = useState(false);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const analytics = useAiAppsAnalytics();

  const openPinMode = useCallback(() => {
    if (!elementPins || !appUid) {
      return;
    }
    analytics.onFeedbackPinsOpened({ appUid });
    setIsPinMode(true);
    if (elementPins.pins.length === 0) {
      elementPins.startPicking();
    }
  }, [elementPins, appUid, analytics]);

  const leavePinMode = () => {
    setIsPinMode(false);
    setActivePinId(null);
  };

  /* A pin made in a frame that has since been remounted (redeploy) or lost its
     bridge can't be shown or sent; drop pin mode with it. */
  const bridgeStatus = elementPins?.status;
  const [seenBridgeStatus, setSeenBridgeStatus] = useState(bridgeStatus);
  if (seenBridgeStatus !== bridgeStatus) {
    setSeenBridgeStatus(bridgeStatus);
    if (bridgeStatus !== 'ready') {
      leavePinMode();
    }
  }

  return {
    isPinMode,
    activePinId,
    setActivePinId,
    openPinMode,
    leavePinMode,
    resumePinMode: () => setIsPinMode(true),
  };
}
