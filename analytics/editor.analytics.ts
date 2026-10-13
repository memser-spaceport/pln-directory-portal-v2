import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

import { EDITOR_ANALYTICS } from '@/utils/constants';

export function useEditorAnalytics() {
  const posthog = usePostHog();

  const onImageResized = useCallback(
    (widthPercent: number) => {
      posthog?.capture(EDITOR_ANALYTICS.IMAGE_RESIZED, { width_percent: widthPercent });
    },
    [posthog],
  );

  return { onImageResized };
}
