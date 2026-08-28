'use client';

import { useEffect } from 'react';

import { markHomeVisited } from '@/utils/homeLastVisited';

/**
 * Records that this browser looked at /home, which is what clears the dot on
 * the header's Home button. Only rendered on /home, so no URL check is needed —
 * the same arrangement AutoMarkNewsNotification uses.
 *
 * Stamped on mount rather than on unmount: leaving the page is not reliably
 * observable (a closed tab fires nothing), and a member who opens /home has
 * seen what was there. The cost is a narrow window — news landing while they
 * are still reading counts as seen — which is the right trade for a dot.
 */
export function MarkHomeVisited() {
  useEffect(() => {
    markHomeVisited();
  }, []);

  return null;
}
