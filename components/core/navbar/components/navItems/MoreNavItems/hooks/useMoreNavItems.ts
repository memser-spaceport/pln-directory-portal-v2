import { useMemo } from 'react';

import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { DEALS_LINK, EVENT_LINKS, FOUNDER_GUIDES_LINK, PLAA_LINK } from '@/components/core/navbar/constants/navLinks';
import { canViewFounderGuide } from '@/services/rbac/utils/founderGuide/canViewFounderGuide';
import { canViewPlaa } from '@/services/rbac/utils/plaa/canViewPlaa';

/**
 * The desktop "More" menu, also the base of the mobile one. Events sits where Job Board did: LAB-3172 swapped the two,
 * so Job Board is a top-level item and the three Events links are flat entries here, in their own order.
 */
export function useMoreNavItems() {
  const { permissions, permsSet } = usePermissions();

  const hasFounderGuidesAccess = canViewFounderGuide(permissions);
  const hasPlaaAccess = canViewPlaa(permsSet);

  return useMemo(
    () => [
      DEALS_LINK,
      ...(hasFounderGuidesAccess ? [FOUNDER_GUIDES_LINK] : []),
      ...EVENT_LINKS,
      ...(hasPlaaAccess ? [PLAA_LINK] : []),
    ],
    [hasFounderGuidesAccess, hasPlaaAccess],
  );
}
