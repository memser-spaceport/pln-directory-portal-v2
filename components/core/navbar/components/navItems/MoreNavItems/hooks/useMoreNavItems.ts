import { useMemo } from 'react';

import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import {
  DEALS_LINK,
  FORUM_LINK,
  FOUNDER_GUIDES_LINK,
  PLAA_LINK,
  publishedAiAppLink,
} from '@/components/core/navbar/constants/navLinks';
import { canViewFounderGuide } from '@/services/rbac/utils/founderGuide/canViewFounderGuide';
import { canViewPlaa } from '@/services/rbac/utils/plaa/canViewPlaa';
import { usePublishedAiApps } from '@/services/ai-apps/hooks/usePublishedAiApps';

/**
 * The desktop "More" menu, also the base of the mobile one. Forum sits where the Events links did: Events and Forum
 * swapped, so Events is a top-level menu and Forum is an entry here. AI Apps published to the member (LAB-3200) come last, one entry each;
 * they are the only way in for members without `ai_apps.read`, so they hang on the published list alone.
 */
export function useMoreNavItems() {
  const { permissions, permsSet } = usePermissions();

  const hasFounderGuidesAccess = canViewFounderGuide(permissions);
  const hasPlaaAccess = canViewPlaa(permsSet);
  const { apps: publishedApps } = usePublishedAiApps();

  return useMemo(
    () => [
      DEALS_LINK,
      ...(hasFounderGuidesAccess ? [FOUNDER_GUIDES_LINK] : []),
      FORUM_LINK,
      ...(hasPlaaAccess ? [PLAA_LINK] : []),
      // Only apps the admin shows under More; the rest open by their link (LAB-3238).
      ...publishedApps.filter((app) => app.showInMore !== false).map(publishedAiAppLink),
    ],
    [hasFounderGuidesAccess, hasPlaaAccess, publishedApps],
  );
}
