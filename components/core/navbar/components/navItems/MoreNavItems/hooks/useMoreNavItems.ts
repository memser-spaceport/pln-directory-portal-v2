import { useMemo } from 'react';

import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import {
  DEALS_LINK,
  FOUNDER_GUIDES_LINK,
  PLAA_LINK,
  publishedAiAppLink,
} from '@/components/core/navbar/constants/navLinks';
import { useGetEventMenuItemLinks } from '@/components/core/navbar/hooks/useGetEventMenuItemLinks';
import { canViewFounderGuide } from '@/services/rbac/utils/founderGuide/canViewFounderGuide';
import { canViewPlaa } from '@/services/rbac/utils/plaa/canViewPlaa';
import { usePublishedAiApps } from '@/services/ai-apps/hooks/usePublishedAiApps';

/**
 * The desktop "More" menu, also the base of the mobile one. Events sits where Job Board did: LAB-3172 swapped the two,
 * so Job Board is a top-level item and the Events links are flat entries here, in their own order: IRL Gatherings
 * (admins only), All Events, Event Contributors. AI Apps published to the member (LAB-3200) come last, one entry each;
 * they are the only way in for members without `ai_apps.read`, so they hang on the published list alone.
 */
export function useMoreNavItems() {
  const { permissions, permsSet } = usePermissions();

  const hasFounderGuidesAccess = canViewFounderGuide(permissions);
  const hasPlaaAccess = canViewPlaa(permsSet);
  const eventLinks = useGetEventMenuItemLinks();
  const { apps: publishedApps } = usePublishedAiApps();

  return useMemo(
    () => [
      DEALS_LINK,
      ...(hasFounderGuidesAccess ? [FOUNDER_GUIDES_LINK] : []),
      ...eventLinks,
      ...(hasPlaaAccess ? [PLAA_LINK] : []),
      ...publishedApps.map(publishedAiAppLink),
    ],
    [hasFounderGuidesAccess, hasPlaaAccess, eventLinks, publishedApps],
  );
}
